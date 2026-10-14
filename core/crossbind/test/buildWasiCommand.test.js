import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { run, state, getData } = vi.hoisted(() => ({
    run: vi.fn(),
    state: { config: {}, targets: [] },
    getData: vi.fn(),
}));

vi.mock('../src/actions/run.js', () => ({ default: run }));
vi.mock('../src/actions/getDependLibs.js', () => ({ default: () => [] }));
vi.mock('../src/actions/getData.js', () => ({ default: getData }));
vi.mock('../src/utils/logger.js', () => ({
    default: { info() {}, error() {}, startStep() {}, doneStep() {}, cachedStep() {} },
}));
vi.mock('../src/state/index.js', () => ({ default: state }));

const { default: buildWasiCommand } = await import('../src/actions/buildWasiCommand.js');
const { wasiNamesOf } = await import('../src/utils/targets.js');

const cli = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

const targetOf = (runtimeEnv) => {
    const target = {
        platform: 'wasi', arch: 'wasm32', runtime: 'st', buildType: 'release', runtimeEnv, path: 'wasi-wasm32-st-release',
    };
    return { ...target, ...wasiNamesOf(target, 'demo') };
};

const linkArgs = () => run.mock.calls.at(-1)[1];

describe('buildWasiCommand', () => {
    let work;

    beforeEach(() => {
        work = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-wasi-command-'));
        state.config = {
            export: {},
            general: { name: 'demo' },
            paths: { build: work, output: `${work}/out`, cli },
            dependencyParameters: { getCmakeDepends: () => [] },
        };
        getData.mockReset();
        getData.mockReturnValue({});
        run.mockReset();
    });

    afterEach(() => {
        fs.rmSync(work, { recursive: true, force: true });
    });

    test('a command links its main through crt1, with no http runtime', async () => {
        await buildWasiCommand(targetOf('wasi'), { force: true });
        const args = linkArgs();
        expect(args[0]).toBe('wasi-clang++');
        expect(args).not.toContain('-mexec-model=reactor');
        expect(args.some((arg) => arg.includes('crossbind_http'))).toBe(false);
        expect(args.at(-1)).toBe(`${work}/demo-wasi-wasm32-st-release.wasm`);
    });

    test('an http component links the handler export into a reactor of its own name', async () => {
        await buildWasiCommand(targetOf('http'), { force: true });
        const args = linkArgs();
        expect(args).toContain('-mexec-model=reactor');
        expect(args).toContain(`${work}/crossbind-wasi-http/handler.cpp`);
        expect(args).toContain(`${work}/crossbind-wasi-http/bindings/crossbind_http_component_type.o`);
        expect(fs.existsSync(`${work}/crossbind-wasi-http/include/crossbind/http.h`)).toBe(true);
        expect(args.at(-1)).toBe(`${work}/demo-wasi-wasm32-st-release.http.wasm`);
    });

    test('a command and an http component of one target cache apart', async () => {
        await buildWasiCommand(targetOf('wasi'), { force: true });
        fs.writeFileSync(`${work}/demo-wasi-wasm32-st-release.wasm`, 'command');
        expect(await buildWasiCommand(targetOf('http'))).toBe(true);
        fs.writeFileSync(`${work}/demo-wasi-wasm32-st-release.http.wasm`, 'component');
        expect(await buildWasiCommand(targetOf('wasi'))).toBe(false);
        expect(await buildWasiCommand(targetOf('http'))).toBe(false);
    });
});
