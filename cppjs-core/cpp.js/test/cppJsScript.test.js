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
    test('only the runtime module (no bridge) exports init', async () => {
        const runtime = await loadModule('runtime-a', getCppJsScript(TARGET));
        const proxy = await loadModule('proxy-a', getCppJsScript(TARGET, '/nonexistent/bridge'));

        expect(typeof runtime.init).toBe('function');
        expect(typeof runtime.initCppJs).toBe('function');
        // Two names for one function keeps old code working without offering two ways to do it.
        expect(runtime.init).toBe(runtime.initCppJs);

        expect(proxy.init).toBeUndefined();
        expect(typeof proxy.initCppJs).toBe('function');
    });

    test('a single init binds the exports of every imported module', async () => {
        const module = { Matrix: 'MATRIX', VectorMatrix: 'VECTOR' };
        // Pre-seeding the boot promise keeps __cppjsBoot (which fetches /cpp.js) out of the test.
        globalThis.__cppjsBinders = undefined;
        globalThis.__cppjsModule = undefined;
        globalThis.__cppjsBootPromise = Promise.resolve(module);

        const runtime = await loadModule('runtime-b', getCppJsScript(TARGET));
        const proxy = await loadModule('proxy-b', getCppJsScript(TARGET, '/nonexistent/bridge'));

        expect(proxy.Matrix).toBeNull();

        // init() comes from the runtime module, which owns no symbols of its own.
        const resolved = await runtime.init();

        expect(resolved).toBe(module);
        expect(proxy.Matrix).toBe('MATRIX');
        expect(proxy.VectorMatrix).toBe('VECTOR');
        expect(proxy.AllSymbols).toBe(module);
    });

    test('the legacy per-module initCppJs still binds every module', async () => {
        // No sample uses this shape any more, so this is the only thing keeping it honest.
        const module = { Matrix: 'LEGACY', VectorMatrix: 'LEGACY_VEC' };
        globalThis.__cppjsBinders = undefined;
        globalThis.__cppjsModule = undefined;
        globalThis.__cppjsBootPromise = Promise.resolve(module);

        const one = await loadModule('proxy-legacy-1', getCppJsScript(TARGET, '/nonexistent/bridge'));
        const two = await loadModule('proxy-legacy-2', getCppJsScript(TARGET, '/nonexistent/bridge'));

        // Old code called each module's own init; one call now resolves both.
        await one.initCppJs();

        expect(one.Matrix).toBe('LEGACY');
        expect(two.Matrix).toBe('LEGACY');

        // Calling the others as well stays a harmless no-op, which is what keeps old apps working.
        await expect(two.initCppJs()).resolves.toBe(module);
    });

    test('a module imported after init binds immediately', async () => {
        const module = { Matrix: 'LATE', VectorMatrix: 'LATE_VEC' };
        globalThis.__cppjsBinders = undefined;
        globalThis.__cppjsModule = undefined;
        globalThis.__cppjsBootPromise = Promise.resolve(module);

        const runtime = await loadModule('runtime-c', getCppJsScript(TARGET));
        await runtime.init();

        const late = await loadModule('proxy-c', getCppJsScript(TARGET, '/nonexistent/bridge'));
        expect(late.Matrix).toBe('LATE');
    });

    test('terminate drops the boot promise so a later init starts a fresh runtime', async () => {
        globalThis.__cppjsBinders = undefined;
        globalThis.__cppjsModule = undefined;
        globalThis.__cppjsBootPromise = Promise.resolve({ Matrix: 'FIRST', VectorMatrix: 'V' });

        const runtime = await loadModule('runtime-d', getCppJsScript(TARGET));
        await runtime.init();
        expect(globalThis.__cppjsModule).toBeTruthy();

        runtime.init.terminate();
        expect(globalThis.__cppjsBootPromise).toBeNull();
        expect(globalThis.__cppjsModule).toBeNull();
    });
});
