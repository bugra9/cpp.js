import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { describe, test, expect } from 'vitest';

// React Native and Node-API addons hand out objects through embind-jsi's JavaScript runtime, which releases what
// JavaScript owns as the wasm glue does after utils/embindObjectLifetime.js.
const runtime = fileURLToPath(new URL('../../embind-jsi/js/embind.js', import.meta.url));
const source = fs.readFileSync(runtime, 'utf8');

// The runtime in a context whose FinalizationRegistry records what it is given, or has none, as Hermes.
function load({ registry = true } = {}) {
    const registered = [];
    const context = vm.createContext({ console });
    context.globalThis = context;
    context.FinalizationRegistry = registry ? class {
        register(target) {
            registered.push(target);
        }

        unregister() {}
    } : undefined;
    vm.runInContext(source.replace(/^export default .*$/m, ''), context);
    const glue = vm.runInContext('({ makeClassHandle, ownHandle, ClassHandle_clone, RegisteredPointer_fromWireType })', context);
    // A converter of a class with no pointer types registered, so a handle takes its default shape.
    const converter = (isReference) => ({
        isReference,
        isSmartPointer: false,
        getPointee: (ptr) => ptr,
        destructor: () => {},
        registeredClass: { getActualType: () => 'Box', instancePrototype: {} },
    });
    return {
        registered,
        copied: () => glue.RegisteredPointer_fromWireType.call(converter(true), 16),
        pointedAt: () => glue.RegisteredPointer_fromWireType.call(converter(false), 16),
        shared: () => glue.makeClassHandle({}, { ptr: 16, smartPtr: 8, smartPtrType: {}, ptrType: {} }),
        construct: (record) => glue.ownHandle(glue.makeClassHandle({}, record)),
        clone: (handle) => glue.ClassHandle_clone.call(handle),
    };
}

describe('embind-jsi', () => {
    test('releases a handle behind a smart pointer when it is collected, as before', () => {
        const runtimeApi = load();
        const shared = runtimeApi.shared();

        expect(runtimeApi.registered).toEqual([shared]);
    });

    test('releases a copy of a returned value, and a clone of its handle', () => {
        const runtimeApi = load();
        const copy = runtimeApi.copied();
        const clone = runtimeApi.clone(copy);

        expect(copy.$$.count.owned).toBe(true);
        expect(runtimeApi.registered).toEqual([copy, clone]);
    });

    test('leaves a raw pointer to its library', () => {
        const runtimeApi = load();
        runtimeApi.pointedAt();

        expect(runtimeApi.registered).toEqual([]);
    });

    test('releases an object constructed through a raw constructor, and a clone of its handle', () => {
        const runtimeApi = load();
        const made = runtimeApi.construct({ ptr: 16, ptrType: {} });
        const clone = runtimeApi.clone(made);

        expect(made.$$.count.owned).toBe(true);
        expect(runtimeApi.registered).toEqual([made, clone]);
    });

    test('registers an object constructed behind a smart pointer once', () => {
        const runtimeApi = load();
        const made = runtimeApi.construct({ ptr: 16, smartPtr: 8, smartPtrType: {}, ptrType: {} });

        expect(runtimeApi.registered).toEqual([made]);
    });

    test('without FinalizationRegistry, as on Hermes, values and constructors work as before', () => {
        const runtimeApi = load({ registry: false });

        expect(runtimeApi.construct({ ptr: 16, ptrType: {} }).$$.ptr).toBe(16);
        expect(runtimeApi.copied().$$.ptr).toBe(16);
        expect(runtimeApi.registered).toEqual([]);
    });

    test('a class constructor hands its object to ownHandle', () => {
        expect(source).toContain('return ownHandle(body.apply(this, arguments));');
    });
});
