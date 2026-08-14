import {
    describe, test, expect, afterEach, vi,
} from 'vitest';

// cargo/rustup run on the host; the tests assert what the engine hands them, not the compile.
vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }));

const ST = { platform: 'wasm', arch: 'wasm32', runtime: 'st' };
const MT = { platform: 'wasm', arch: 'wasm32', runtime: 'mt' };
const TRIPLE = 'wasm32-unknown-emscripten';

async function importFresh() {
    vi.resetModules();
    const { spawnSync } = await import('node:child_process');
    const mod = await import('../src/utils/rustMt.js');
    return { ...mod, spawnSync };
}

const savedRustflags = process.env.RUSTFLAGS;
afterEach(() => {
    if (savedRustflags === undefined) delete process.env.RUSTFLAGS;
    else process.env.RUSTFLAGS = savedRustflags;
});

describe('rustMt', () => {
    test('isMtWasm matches only the wasm mt runtime', async () => {
        const { isMtWasm } = await importFresh();
        expect(isMtWasm(MT)).toBe(true);
        expect(isMtWasm(ST)).toBe(false);
        expect(isMtWasm({ platform: 'ios', arch: 'iphoneos', runtime: 'mt' })).toBe(false);
    });

    test('assertMtRustToolchain passes when nightly rust-src is installed', async () => {
        const { assertMtRustToolchain, spawnSync } = await importFresh();
        spawnSync.mockReturnValue({ status: 0, stdout: 'rust-src (installed)\n' });
        expect(() => assertMtRustToolchain()).not.toThrow();
        expect(spawnSync.mock.calls[0][0]).toBe('rustup');
    });

    test('assertMtRustToolchain fails actionably when rustup/nightly is missing', async () => {
        const { assertMtRustToolchain, spawnSync } = await importFresh();
        spawnSync.mockReturnValue({ status: 1 });
        expect(() => assertMtRustToolchain()).toThrow(/rustup toolchain install nightly/);
    });

    test('assertMtRustToolchain fails when nightly lacks rust-src', async () => {
        const { assertMtRustToolchain, spawnSync } = await importFresh();
        spawnSync.mockReturnValue({ status: 0, stdout: 'cargo (installed)\n' });
        expect(() => assertMtRustToolchain()).toThrow(/rust-src/);
    });

    test('cargoTargetDirFor splits st and mt target dirs', async () => {
        const { cargoTargetDirFor } = await importFresh();
        expect(cargoTargetDirFor('/x', ST)).toBe('/x/target');
        expect(cargoTargetDirFor('/x', MT)).toBe('/x/target-mt');
    });

    test('cargoBuildInvocation st: stable args, untouched env', async () => {
        const { cargoBuildInvocation } = await importFresh();
        const { args, env, isMt } = cargoBuildInvocation({
            target: ST, triple: TRIPLE, targetDir: '/x/target', manifestPath: '/x/Cargo.toml',
        });
        expect(isMt).toBe(false);
        expect(args).toEqual(['build', '--release', '--target', TRIPLE, '--target-dir', '/x/target', '--manifest-path', '/x/Cargo.toml']);
        expect(env).toBe(process.env);
    });

    test('cargoBuildInvocation mt: nightly build-std args and atomics RUSTFLAGS', async () => {
        const { cargoBuildInvocation } = await importFresh();
        const { args, env, isMt } = cargoBuildInvocation({
            target: MT, triple: TRIPLE, targetDir: '/x/target-mt', manifestPath: '/x/Cargo.toml',
        });
        expect(isMt).toBe(true);
        expect(args[0]).toBe('+nightly');
        expect(args).toContain('-Zbuild-std=std,panic_abort');
        expect(args).toContain('/x/target-mt');
        expect(env.RUSTFLAGS).toContain('+atomics,+bulk-memory,+mutable-globals');
    });

    test('cargoBuildInvocation mt preserves pre-existing RUSTFLAGS', async () => {
        process.env.RUSTFLAGS = '-C opt-level=3';
        const { cargoBuildInvocation } = await importFresh();
        const { env } = cargoBuildInvocation({
            target: MT, triple: TRIPLE, targetDir: '/x/target-mt', manifestPath: '/x/Cargo.toml',
        });
        expect(env.RUSTFLAGS).toContain('-C opt-level=3');
        expect(env.RUSTFLAGS).toContain('+atomics');
    });
});
