import {
    describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import {
    callWithVectorCoercion,
    constructWithVectorCoercion,
    wrapModuleForCoercion,
    unwrapCoercionProxy,
    setCoercionModule,
} from '../src/assets/js-runtime/adapters/vector-coercion.js';

class FakeVector {
    constructor() {
        this.items = [];
        this.deleted = false;
    }

    push_back(item) {
        this.items.push(item);
    }

    size() {
        return this.items.length;
    }

    get(i) {
        return this.items[i];
    }

    delete() {
        this.deleted = true;
    }
}

class VectorString extends FakeVector {}
class VectorInt extends FakeVector {}

// Mirrors embind's BindingError message exactly - the coercion depends on this format.
function bindingError(typeName, value) {
    return new Error(`Cannot pass "${value}" as a ${typeName}`);
}

// A mock embind Module: vector classes + toVector, a couple of methods/constructors that
// require real vectors, and data members (HEAP typed array, FS object) that direct-mode
// code accesses raw. `created` collects every temporary the coercion builds.
function makeModule(created) {
    return {
        VectorString,
        VectorInt,
        HEAPU8: new Uint8Array([1, 2, 3]),
        FS: { readFile() { return 'x'; } },
        toVector(VectorClass, array = []) {
            const vector = new VectorClass();
            array.forEach((item) => vector.push_back(item));
            created.push(vector);
            return vector;
        },
        joinNames(names) {
            if (!(names instanceof VectorString)) throw bindingError('VectorString', names);
            return names.items.join(',');
        },
        Bag: class Bag {
            constructor(nums) {
                if (!(nums instanceof VectorInt)) throw bindingError('VectorInt', nums);
                this.nums = nums.items.slice();
            }
        },
        makeThing() {
            return { tag: 'thing' };
        },
    };
}

describe('constructWithVectorCoercion', () => {
    let created;
    let m;

    beforeEach(() => {
        created = [];
        m = makeModule(created);
        setCoercionModule(m);
    });

    afterEach(() => {
        setCoercionModule(null);
    });

    test('coerces a plain-array constructor argument and deletes the temporary', () => {
        const bag = constructWithVectorCoercion(m.Bag, [[1, 2, 3]]);
        expect(bag.nums).toEqual([1, 2, 3]);
        expect(bag).toBeInstanceOf(m.Bag);
        expect(created).toHaveLength(1);
        expect(created[0].deleted).toBe(true);
    });

    test('passes a real vector constructor argument through untouched', () => {
        const vec = m.toVector(m.VectorInt, [4, 5]);
        created.length = 0;
        const bag = constructWithVectorCoercion(m.Bag, [vec]);
        expect(bag.nums).toEqual([4, 5]);
        expect(created).toHaveLength(0);
        expect(vec.deleted).toBe(false);
    });

    test('rethrows a non-vector construction error and cleans up', () => {
        const created2 = [];
        setCoercionModule(makeModule(created2));
        class Strict {
            constructor() {
                throw new Error('boom');
            }
        }
        expect(() => constructWithVectorCoercion(Strict, [])).toThrow('boom');
        expect(created2).toHaveLength(0);
    });
});

describe('wrapModuleForCoercion (direct / non-worker mode)', () => {
    let created;
    let m;
    let M;

    beforeEach(() => {
        created = [];
        m = makeModule(created);
        setCoercionModule(m);
        M = wrapModuleForCoercion(m);
    });

    afterEach(() => {
        setCoercionModule(null);
    });

    test('coerces a plain-array argument passed to a module method', () => {
        expect(M.joinNames(['a', 'b'])).toBe('a,b');
        expect(created).toHaveLength(1);
        expect(created[0].deleted).toBe(true);
    });

    test('passes a real vector argument through a module method untouched', () => {
        const vec = m.toVector(m.VectorString, ['x']);
        created.length = 0;
        expect(M.joinNames(vec)).toBe('x');
        expect(created).toHaveLength(0);
        expect(vec.deleted).toBe(false);
    });

    test('leaves data members (typed arrays, objects) raw and identical', () => {
        // The whole point of the narrow wrapper: HEAP*/FS must not be proxied, or direct-mode
        // index access and identity comparison break.
        expect(M.HEAPU8).toBe(m.HEAPU8);
        expect(M.HEAPU8[0]).toBe(1);
        expect(M.FS).toBe(m.FS);
    });

    test('coerces a plain-array argument through `new`', () => {
        const bag = new M.Bag([7, 8]);
        expect(bag.nums).toEqual([7, 8]);
        expect(bag).toBeInstanceOf(m.Bag);
        expect(created).toHaveLength(1);
        expect(created[0].deleted).toBe(true);
    });

    test('returns objects raw - identity is preserved, not wrapped', () => {
        const thing = M.makeThing();
        expect(thing).toEqual({ tag: 'thing' });
        expect(unwrapCoercionProxy(thing)).toBe(thing);
    });

    test('the wrapped module unwraps to the raw module (embind identity)', () => {
        expect(unwrapCoercionProxy(M)).toBe(m);
    });

    test('returns the same wrapped function for repeated access (stable identity)', () => {
        expect(M.joinNames).toBe(M.joinNames);
    });
});

describe('embind error-message canary (guards the reactive coercion, review item 3)', () => {
    test('coercion engages against the exact embind BindingError string', () => {
        // If embind ever changes "Cannot pass X as a VectorY", coercion silently stops
        // engaging and this end-to-end assertion fails first - a canary, not a unit of logic.
        const created = [];
        setCoercionModule({
            VectorString,
            toVector(VectorClass, array = []) {
                const vector = new VectorClass();
                array.forEach((item) => vector.push_back(item));
                created.push(vector);
                return vector;
            },
        });
        const fn = (names) => {
            if (!(names instanceof VectorString)) {
                // The precise message embind produces today.
                throw new Error(`Cannot pass "${names}" as a VectorString`);
            }
            return names.items.length;
        };
        expect(callWithVectorCoercion(fn, undefined, [['a', 'b', 'c']])).toBe(3);
        expect(created).toHaveLength(1);
        expect(created[0].deleted).toBe(true);
        setCoercionModule(null);
    });
});
