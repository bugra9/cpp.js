import { describe, test, expect } from 'vitest';
import * as Comlink from 'comlink';
import { registerModuleEnums } from '../src/assets/js-runtime/adapters/worker-comlink.js';
import { wrapWithVectorCoercion } from '../src/assets/js-runtime/adapters/vector-coercion.js';

// Mirrors embind's enum shape: value instances share a non-Object constructor and carry a
// numeric .value; the holder is a plain object keyed by enumerator name.
class EnumVal {
    constructor(value) { this.value = value; }
}

function makeModule() {
    const Fast = new EnumVal(0);
    const Slow = new EnumVal(1);
    // Mirrors the real embind shape: the holder is the enum TYPE function carrying the
    // enumerators plus a `values` meta map of the same instances.
    function Mode() {}
    Mode.values = { 0: Fast, 1: Slow };
    Mode.Fast = Fast;
    Mode.Slow = Slow;
    return {
        Mode,
        HEAP8: new Int8Array(4),
        FS: { readFile() {} },
        plainConfig: { value: 3 },
    };
}

const handler = () => Comlink.transferHandlers.get('embindEnum');

describe('worker enum transfer handler', () => {
    test('registered enum values are handled; heaps, fn-holders and plain objects are not', () => {
        const m = makeModule();
        registerModuleEnums(m);
        expect(handler().canHandle(m.Mode.Fast)).toBe(true);
        expect(handler().canHandle(m.HEAP8)).toBe(false);
        expect(handler().canHandle(m.FS)).toBe(false);
        expect(handler().canHandle(m.plainConfig)).toBe(false);
        expect(handler().canHandle(null)).toBe(false);
    });

    test('worker-side roundtrip resolves back to the same instance', () => {
        const m = makeModule();
        registerModuleEnums(m);
        const [data] = handler().serialize(m.Mode.Slow);
        expect(data.value).toBe(1);
        expect(handler().deserialize(data)).toBe(m.Mode.Slow);
    });

    test('coercion-wrapped enum values are unwrapped before serialization', () => {
        const m = makeModule();
        registerModuleEnums(m);
        const wrapped = wrapWithVectorCoercion(m.Mode.Fast);
        expect(handler().canHandle(wrapped)).toBe(true);
        const [data] = handler().serialize(wrapped);
        expect(handler().deserialize(data)).toBe(m.Mode.Fast);
    });

    test('main side builds identity-stable frozen tokens for unknown ids', () => {
        const data = { __embindEnumRef: 987654, value: 2 };
        const token1 = handler().deserialize(data);
        const token2 = handler().deserialize(data);
        expect(token1).toBe(token2);
        expect(token1.value).toBe(2);
        expect(Object.isFrozen(token1)).toBe(true);
    });

    test('tokens serialize back to their original ref id', () => {
        const token = handler().deserialize({ __embindEnumRef: 987655, value: 1 });
        expect(handler().canHandle(token)).toBe(true);
        const [data] = handler().serialize(token);
        expect(data.__embindEnumRef).toBe(987655);
    });
});
