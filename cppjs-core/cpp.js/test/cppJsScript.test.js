import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, test, expect, vi, afterAll } from 'vitest';

vi.mock('../src/actions/getData.js', () => ({ default: () => ({}) }));
vi.mock('../src/utils/loadJson.js', () => ({ default: () => ['VectorMatrix', 'Matrix'] }));
vi.mock('../src/state/index.js', () => ({ default: { config: { paths: {}, ext: {} } } }));

const { default: getCppJsScript } = await import('../src/integration/getCppJsScript.js');

const TARGET = { platform: 'wasm' };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cppjs-script-'));

// The generated text is an ES module, so it has to be evaluated as one to observe live bindings.
async function loadModule(name, source) {
    const file = path.join(dir, `${name}.mjs`);
    fs.writeFileSync(file, source);
    return import(pathToFileURL(file).href);
}

afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('generated proxy modules', () => {
    test('every module exports initNative alongside its symbols', async () => {
        const proxy = await loadModule('proxy-a', getCppJsScript(TARGET, '/nonexistent/bridge'));

        expect(typeof proxy.initNative).toBe('function');
        // One name only: the old init / initCppJs aliases are gone.
        expect(proxy.init).toBeUndefined();
        expect(proxy.initCppJs).toBeUndefined();
    });

    test('a bridge file is required - there is no bare runtime module any more', () => {
        expect(() => getCppJsScript(TARGET)).toThrow(/bridge file/);
    });

    test('a single init binds the exports of every imported module', async () => {
        const module = { Matrix: 'MATRIX', VectorMatrix: 'VECTOR' };
        // Pre-seeding the boot promise keeps __cppjsBoot (which fetches /cpp.js) out of the test.
        globalThis.__cppjsBinders = undefined;
        globalThis.__cppjsModule = undefined;
        globalThis.__cppjsBootPromise = Promise.resolve(module);

        const one = await loadModule('proxy-b1', getCppJsScript(TARGET, '/nonexistent/bridge'));
        const proxy = await loadModule('proxy-b2', getCppJsScript(TARGET, '/nonexistent/bridge'));

        expect(proxy.Matrix).toBeNull();

        // init() comes from whichever module the app already imports.
        const resolved = await one.initNative();

        expect(resolved).toBe(module);
        expect(proxy.Matrix).toBe('MATRIX');
        expect(proxy.VectorMatrix).toBe('VECTOR');
        expect(proxy.AllSymbols).toBe(module);
    });

    test('calling initNative on one module binds the others too', async () => {
        // Apps import several generated modules; whichever one they boot binds all of them.
        const module = { Matrix: 'LEGACY', VectorMatrix: 'LEGACY_VEC' };
        globalThis.__cppjsBinders = undefined;
        globalThis.__cppjsModule = undefined;
        globalThis.__cppjsBootPromise = Promise.resolve(module);

        const one = await loadModule('proxy-legacy-1', getCppJsScript(TARGET, '/nonexistent/bridge'));
        const two = await loadModule('proxy-legacy-2', getCppJsScript(TARGET, '/nonexistent/bridge'));

        // One call resolves both modules.
        await one.initNative();

        expect(one.Matrix).toBe('LEGACY');
        expect(two.Matrix).toBe('LEGACY');

        // A second call on another module is a harmless no-op.
        await expect(two.initNative()).resolves.toBe(module);
    });

    test('a module imported after init binds immediately', async () => {
        const module = { Matrix: 'LATE', VectorMatrix: 'LATE_VEC' };
        globalThis.__cppjsBinders = undefined;
        globalThis.__cppjsModule = undefined;
        globalThis.__cppjsBootPromise = Promise.resolve(module);

        const early = await loadModule('proxy-c1', getCppJsScript(TARGET, '/nonexistent/bridge'));
        await early.initNative();

        const late = await loadModule('proxy-c', getCppJsScript(TARGET, '/nonexistent/bridge'));
        expect(late.Matrix).toBe('LATE');
    });

    test('terminate drops the boot promise so a later init starts a fresh runtime', async () => {
        globalThis.__cppjsBinders = undefined;
        globalThis.__cppjsModule = undefined;
        globalThis.__cppjsBootPromise = Promise.resolve({ Matrix: 'FIRST', VectorMatrix: 'V' });

        const proxy = await loadModule('proxy-d', getCppJsScript(TARGET, '/nonexistent/bridge'));
        await proxy.initNative();
        expect(globalThis.__cppjsModule).toBeTruthy();

        proxy.initNative.terminate();
        expect(globalThis.__cppjsBootPromise).toBeNull();
        expect(globalThis.__cppjsModule).toBeNull();
    });
});
