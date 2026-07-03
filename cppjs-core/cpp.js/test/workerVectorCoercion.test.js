import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
    callWithVectorCoercion,
    wrapWithVectorCoercion,
    setCoercionModule,
} from '../src/assets/js-runtime/adapters/worker-comlink.js';

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
class VectorDataset extends FakeVector {}

function bindingError(typeName, value) {
    // Mirrors embind: BindingError('Cannot pass "<value>" as a <TypeName>')
    return new Error(`Cannot pass "${value}" as a ${typeName}`);
}

describe('callWithVectorCoercion', () => {
    let created;

    beforeEach(() => {
        created = [];
        setCoercionModule({
            VectorString,
            VectorDataset,
            toVector(VectorClass, array = []) {
                const vector = new VectorClass();
                array.forEach((item) => vector.push_back(item));
                created.push(vector);
                return vector;
            },
        });
    });

    afterEach(() => {
        setCoercionModule(null);
    });

    test('converts a plain-array argument and deletes the temporary', () => {
        const fn = (dest, opts) => {
            if (!(opts instanceof VectorString)) throw bindingError('VectorString', opts);
            return `ok:${opts.items.join(',')}`;
        };

        const result = callWithVectorCoercion(fn, undefined, ['/out.tif', ['-of', 'COG']]);

        expect(result).toBe('ok:-of,COG');
        expect(created).toHaveLength(1);
        expect(created[0].deleted).toBe(true);
    });

    test('passes real vectors through untouched', () => {
        const vector = new VectorString();
        vector.push_back('a');
        const fn = (opts) => {
            if (!(opts instanceof VectorString)) throw bindingError('VectorString', opts);
            return opts;
        };

        const result = callWithVectorCoercion(fn, undefined, [vector]);

        expect(result).toBe(vector);
        expect(vector.deleted).toBe(false);
        expect(created).toHaveLength(0);
    });

    test('coerces mixed vector types left to right', () => {
        const fn = (dest, srcs, names, opts) => {
            if (!(srcs instanceof VectorDataset)) throw bindingError('VectorDataset', srcs);
            if (!(names instanceof VectorString)) throw bindingError('VectorString', names);
            if (!(opts instanceof VectorString)) throw bindingError('VectorString', opts);
            return srcs.items.length + names.items.length + opts.items.length;
        };

        const result = callWithVectorCoercion(fn, undefined, [
            '/out.vrt', [{ dataset: true }], ['a.tif', 'b.tif'], ['-strict'],
        ]);

        expect(result).toBe(4);
        expect(created).toHaveLength(3);
        expect(created[0]).toBeInstanceOf(VectorDataset);
        expect(created[1]).toBeInstanceOf(VectorString);
        expect(created[2]).toBeInstanceOf(VectorString);
        expect(created.every((v) => v.deleted)).toBe(true);
    });

    test('rethrows the original error when the vector class is unknown', () => {
        const original = bindingError('VectorFoo', 'x');
        const fn = () => { throw original; };

        expect(() => callWithVectorCoercion(fn, undefined, [['x']])).toThrow(original);
        expect(created).toHaveLength(0);
    });

    test('rethrows when no plain-array argument remains', () => {
        const original = bindingError('VectorString', 'x');
        const fn = () => { throw original; };

        expect(() => callWithVectorCoercion(fn, undefined, ['just-a-string', 42])).toThrow(original);
    });

    test('does not engage on non-vector binding errors', () => {
        const original = new Error('Cannot pass "x" as a Dataset');
        const fn = () => { throw original; };

        expect(() => callWithVectorCoercion(fn, undefined, [['x']])).toThrow(original);
        expect(created).toHaveLength(0);
    });

    test('terminates when the callee rejects even converted vectors', () => {
        const fn = (arg) => { throw bindingError('VectorString', arg); };

        expect(() => callWithVectorCoercion(fn, undefined, [['x']])).toThrow(/VectorString/);
        expect(created).toHaveLength(1);
        expect(created[0].deleted).toBe(true);
    });

    test('defers temporary deletion until a thenable result settles', async () => {
        const fn = (opts) => {
            if (!(opts instanceof VectorString)) throw bindingError('VectorString', opts);
            return Promise.resolve(opts.items.length);
        };

        const pending = callWithVectorCoercion(fn, undefined, [['a', 'b']]);

        expect(created[0].deleted).toBe(false);
        await expect(pending).resolves.toBe(2);
        expect(created[0].deleted).toBe(true);
    });
});

describe('wrapWithVectorCoercion', () => {
    beforeEach(() => {
        setCoercionModule({
            VectorString,
            toVector(VectorClass, array = []) {
                const vector = new VectorClass();
                array.forEach((item) => vector.push_back(item));
                return vector;
            },
        });
    });

    afterEach(() => {
        setCoercionModule(null);
    });

    test('coerces through nested member access with the right this', () => {
        const api = {
            label: 'module',
            ns: {
                marker: 'ns',
                method(opts) {
                    if (!(opts instanceof VectorString)) throw bindingError('VectorString', opts);
                    return `${this.marker}:${opts.items.join(',')}`;
                },
            },
        };

        const wrapped = wrapWithVectorCoercion(api);

        expect(wrapped.label).toBe('module');
        expect(wrapped.ns.method(['-a', '-b'])).toBe('ns:-a,-b');
    });

    test('leaves constructors usable', () => {
        class Thing {
            constructor(value) {
                this.value = value;
            }
        }
        const wrapped = wrapWithVectorCoercion({ Thing });

        const instance = new wrapped.Thing(7);

        expect(instance).toBeInstanceOf(Thing);
        expect(instance.value).toBe(7);
    });
});
