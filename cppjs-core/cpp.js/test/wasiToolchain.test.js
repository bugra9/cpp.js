import { describe, test, expect } from 'vitest';
import {
    wasiCFlags, wasiCxxFlags, resolveWasiSdkPath, WASI_LINK_LIBS,
} from '../src/utils/wasiToolchain.js';

describe('wasi flag composition', () => {
    test('C flags carry the emulation defines and the sjlj/new-EH toggles', () => {
        const flags = wasiCFlags();
        expect(flags).toContain('-D_WASI_EMULATED_SIGNAL');
        expect(flags).toContain('-mexception-handling');
        expect(flags.join(' ')).toContain('-mllvm -wasm-enable-sjlj');
        expect(flags.join(' ')).toContain('-mllvm -wasm-use-legacy-eh=false');
        expect(flags).not.toContain('-fwasm-exceptions');
    });

    test('C++ flags additionally enable wasm exceptions', () => {
        expect(wasiCxxFlags()).toContain('-fwasm-exceptions');
    });

    test('link libs end with the emulation archives and start with unwind', () => {
        expect(WASI_LINK_LIBS[0]).toBe('-lunwind');
        expect(WASI_LINK_LIBS).toContain('-lsetjmp');
    });
});

describe('resolveWasiSdkPath', () => {
    test('env override wins over system config', () => {
        expect(resolveWasiSdkPath({ WASI_SDK_PATH: '/sys' }, { CPPJS_WASI_SDK_PATH: '/env' })).toBe('/env');
    });

    test('falls back to system config, then null', () => {
        expect(resolveWasiSdkPath({ WASI_SDK_PATH: '/sys' }, {})).toBe('/sys');
        expect(resolveWasiSdkPath({ WASI_SDK_PATH: '' }, {})).toBeNull();
        expect(resolveWasiSdkPath(undefined, {})).toBeNull();
    });
});
