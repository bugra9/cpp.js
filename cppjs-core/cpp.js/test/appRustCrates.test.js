import {
    describe, test, expect, beforeEach, afterEach, vi,
} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// cargo runs on the host; the test asserts what the engine hands it, not the compile itself.
vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }));

const WASM = { platform: 'wasm', arch: 'wasm32' };
const TRIPLE = 'wasm32-unknown-emscripten';

let work;
let cacheDir;

async function importFresh() {
    vi.resetModules();
    const { spawnSync } = await import('node:child_process');
    const { default: buildAppRustCrates } = await import('../src/utils/appRustCrates.js');
    return { buildAppRustCrates, spawnSync };
}

function addCrate(name) {
    const dir = path.join(cacheDir, 'rust-bridges', name);
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'Cargo.toml'), `[package]\nname = "${name}-cppjs-app"\n`);
    fs.writeFileSync(path.join(dir, 'src/lib.rs'), '');
}

function fakeCargoOutput() {
    const lib = path.join(cacheDir, 'rust-bridges/_app_super/target', TRIPLE, 'release/libcppjs_app_super.a');
    fs.mkdirSync(path.dirname(lib), { recursive: true });
    fs.writeFileSync(lib, '');
    return lib;
}

beforeEach(() => {
    work = fs.mkdtempSync(path.join(os.tmpdir(), 'cppjs-app-rust-'));
    cacheDir = path.join(work, '.cppjs');
});

afterEach(() => {
    fs.rmSync(work, { recursive: true, force: true });
});

describe('buildAppRustCrates', () => {
    test('does nothing when the project has no rust bridges directory', async () => {
        const { buildAppRustCrates, spawnSync } = await importFresh();
        expect(buildAppRustCrates(WASM, cacheDir)).toEqual([]);
        expect(spawnSync).not.toHaveBeenCalled();
    });

    test('does nothing when the directory holds no crates', async () => {
        fs.mkdirSync(path.join(cacheDir, 'rust-bridges'), { recursive: true });
        const { buildAppRustCrates, spawnSync } = await importFresh();
        expect(buildAppRustCrates(WASM, cacheDir)).toEqual([]);
        expect(spawnSync).not.toHaveBeenCalled();
    });

    test('bundles every app-local surface into one super staticlib', async () => {
        addCrate('counter');
        addCrate('geo_surface');
        const { buildAppRustCrates, spawnSync } = await importFresh();
        spawnSync.mockImplementation(() => { fakeCargoOutput(); return { status: 0 }; });

        const libs = buildAppRustCrates(WASM, cacheDir);

        const superDir = path.join(cacheDir, 'rust-bridges/_app_super');
        const manifest = fs.readFileSync(path.join(superDir, 'Cargo.toml'), 'utf8');
        const lib = fs.readFileSync(path.join(superDir, 'src/lib.rs'), 'utf8');
        expect(manifest).toContain('name = "cppjs-app-super"');
        expect(manifest).toContain('crate-type = ["staticlib"]');
        expect(manifest).toContain('counter-cppjs-app = { path = ');
        expect(manifest).toContain('geo-surface-cppjs-app = { path = ');
        expect(lib).toContain('use counter_cppjs_app as _;');
        expect(lib).toContain('use geo_surface_cppjs_app as _;');
        expect(libs).toEqual([path.join(superDir, 'target', TRIPLE, 'release/libcppjs_app_super.a')]);

        const [command, args] = spawnSync.mock.calls[0];
        expect(command).toBe('cargo');
        expect(args).toContain('--target');
        expect(args).toContain(TRIPLE);
    });

    test('rejects platforms rust cannot target', async () => {
        addCrate('counter');
        const { buildAppRustCrates } = await importFresh();
        expect(() => buildAppRustCrates({ platform: 'wasi', arch: 'wasm32' }, cacheDir))
            .toThrow(/do not support platform/);
    });

    test('fails loudly when cargo fails', async () => {
        addCrate('counter');
        const { buildAppRustCrates, spawnSync } = await importFresh();
        spawnSync.mockReturnValue({ status: 101 });
        expect(() => buildAppRustCrates(WASM, cacheDir)).toThrow(/cargo build failed/);
    });

    test('fails loudly when cargo reports success but produces no archive', async () => {
        addCrate('counter');
        const { buildAppRustCrates, spawnSync } = await importFresh();
        spawnSync.mockReturnValue({ status: 0 });
        expect(() => buildAppRustCrates(WASM, cacheDir)).toThrow(/not found/);
    });
});
