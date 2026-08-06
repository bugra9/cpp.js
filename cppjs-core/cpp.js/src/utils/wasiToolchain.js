// Toolchain surface for platform:'wasi' (wasm32-wasip3, wasi-sdk >= 34; run under `wasmtime`).

export const WASI_TARGET_TRIPLE = 'wasm32-wasip3';
// The sdk's clang still defaults to wasip1, so every compile/link carries --target explicitly.
export const WASI_TARGET_FLAGS = [`--target=${WASI_TARGET_TRIPLE}`];

export const WASI_COMPILE_DEFINES = [
    '-D_WASI_EMULATED_SIGNAL',
    '-D_WASI_EMULATED_PROCESS_CLOCKS',
    '-D_WASI_EMULATED_MMAN',
    '-D_WASI_EMULATED_GETPID',
];

// -mexception-handling unlocks wasi-libc's setjmp.h (-mllvm flags are invisible to the preprocessor); engines only run standard Wasm 3.0 EH, hence legacy-eh=false.
export const WASI_EH_CFLAGS = [
    '-mexception-handling',
    '-mllvm', '-wasm-enable-sjlj',
    '-mllvm', '-wasm-use-legacy-eh=false',
];

// Back the _WASI_EMULATED_* defines; safe in configure-probe LIBS.
export const WASI_EMULATION_LIBS = [
    '-lwasi-emulated-signal',
    '-lwasi-emulated-process-clocks',
    '-lwasi-emulated-mman',
    '-lwasi-emulated-getpid',
];

// Must trail every archive; -lunwind/-lsetjmp resolve only under -fwasm-exceptions' eh/ sysroot, so keep them out of C-mode probes.
export const WASI_LINK_LIBS = [
    '-lunwind',
    '-lsetjmp',
    ...WASI_EMULATION_LIBS,
];

export function wasiCFlags() {
    return [...WASI_TARGET_FLAGS, ...WASI_COMPILE_DEFINES, ...WASI_EH_CFLAGS];
}

export function wasiCxxFlags() {
    return [...WASI_TARGET_FLAGS, ...WASI_COMPILE_DEFINES, '-fwasm-exceptions', ...WASI_EH_CFLAGS];
}

// Env override first, then persistent ~/.cppjs.json; null when unset.
export function resolveWasiSdkPath(system, env = process.env) {
    return env.CPPJS_WASI_SDK_PATH || system?.WASI_SDK_PATH || null;
}
