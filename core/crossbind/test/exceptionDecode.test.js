import { describe, test, expect } from 'vitest';
import {
    decodeCppException,
    setExceptionDecodeModule,
    patchModuleForExceptionDecode,
} from '../src/assets/js-runtime/adapters/exception-decode.js';
import {
    callWithVectorCoercion,
    setCoercionModule,
} from '../src/assets/js-runtime/adapters/vector-coercion.js';

// Real wasm-EH objects: node ships WebAssembly.Exception/Tag, so the tests exercise the
// exact instanceof path the browser/node glue hits.
const tag = new WebAssembly.Tag({ parameters: ['i32'] });
const makeWasmException = () => new WebAssembly.Exception(tag, [7]);

const helperModule = {
    getExceptionMessage: () => ['std::invalid_argument', 'sqrt of negative'],
};

describe('decodeCppException', () => {
    test('decodes a WebAssembly.Exception into an Error carrying type and message', () => {
        setExceptionDecodeModule(helperModule);
        const decoded = decodeCppException(makeWasmException());
        expect(decoded).toBeInstanceOf(Error);
        expect(decoded.message).toContain('std::invalid_argument');
        expect(decoded.message).toContain('sqrt of negative');
        expect(decoded.cppType).toBe('std::invalid_argument');
        expect(decoded.cppMessage).toBe('sqrt of negative');
    });

    test('uses the type alone when the exception carries no message', () => {
        setExceptionDecodeModule({ getExceptionMessage: () => ['std::bad_alloc', undefined] });
        const decoded = decodeCppException(makeWasmException());
        expect(decoded).toBeInstanceOf(Error);
        expect(decoded.message).toBe('std::bad_alloc');
    });

    test('passes plain errors through untouched', () => {
        setExceptionDecodeModule(helperModule);
        const plain = new Error('regular');
        expect(decodeCppException(plain)).toBe(plain);
    });

    test('passes the exception through when no module or helper is available', () => {
        setExceptionDecodeModule(null);
        const e1 = makeWasmException();
        expect(decodeCppException(e1)).toBe(e1);
        setExceptionDecodeModule({});
        const e2 = makeWasmException();
        expect(decodeCppException(e2)).toBe(e2);
    });

    test('passes the exception through when the helper itself throws', () => {
        setExceptionDecodeModule({ getExceptionMessage: () => { throw new Error('decoder broken'); } });
        const e = makeWasmException();
        expect(decodeCppException(e)).toBe(e);
    });
});

describe('patchModuleForExceptionDecode', () => {
    function makeFakeModule() {
        function Ops() { this.ready = true; }
        Ops.prototype.checkedSqrt = function checkedSqrt() { throw makeWasmException(); };
        Ops.prototype.echo = function echo(v) { return `${v}!`; };
        Ops.prototype.asyncBoom = function asyncBoom() { return Promise.reject(makeWasmException()); };
        Ops.staticBoom = function staticBoom() { throw makeWasmException(); };
        function plainRuntimeFn() { return 1; }
        return {
            Ops, plainRuntimeFn, HEAP8: new Int8Array(4), getExceptionMessage: helperModule.getExceptionMessage,
        };
    }

    test('instance methods throw decoded errors after the patch', () => {
        const m = patchModuleForExceptionDecode(makeFakeModule());
        const o = new m.Ops();
        expect(() => o.checkedSqrt()).toThrowError(/sqrt of negative/);
        expect(o.echo('hi')).toBe('hi!');
    });

    test('static methods throw decoded errors after the patch', () => {
        const m = patchModuleForExceptionDecode(makeFakeModule());
        expect(() => m.Ops.staticBoom()).toThrowError(/sqrt of negative/);
    });

    test('static-only classes (no prototype methods) are patched too', () => {
        function OnlyStatics() {}
        OnlyStatics.checkedSqrt = function checkedSqrt() { throw makeWasmException(); };
        const m = patchModuleForExceptionDecode({
            OnlyStatics, getExceptionMessage: helperModule.getExceptionMessage,
        });
        expect(() => m.OnlyStatics.checkedSqrt()).toThrowError(/sqrt of negative/);
    });

    test('rejected promises from async bindings are decoded too', async () => {
        const m = patchModuleForExceptionDecode(makeFakeModule());
        const o = new m.Ops();
        await expect(o.asyncBoom()).rejects.toThrowError(/sqrt of negative/);
    });

    test('non-class module members are left untouched', () => {
        const raw = makeFakeModule();
        const before = raw.plainRuntimeFn;
        const m = patchModuleForExceptionDecode(raw);
        expect(m.plainRuntimeFn).toBe(before);
        expect(m.HEAP8).toBeInstanceOf(Int8Array);
    });
});

describe('coercion call path decode', () => {
    test('module-level calls through callWithVectorCoercion surface decoded errors', () => {
        setCoercionModule(helperModule);
        setExceptionDecodeModule(helperModule);
        const boom = () => { throw makeWasmException(); };
        expect(() => callWithVectorCoercion(boom, undefined, [])).toThrowError(/sqrt of negative/);
    });
});
