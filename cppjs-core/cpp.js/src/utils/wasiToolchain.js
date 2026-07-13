// Toolchain surface for platform:'wasi' (wasm32-wasip1 via wasi-sdk).
// Verified against wasi-sdk 33 + wasmtime 46 (run with `-W exceptions=y`):
// - wasi-libc gates setjmp.h behind the __wasm_exception_handling__ macro,
//   which only -mexception-handling defines (an -mllvm flag is invisible to
//   the preprocessor); the sjlj lowering itself needs -wasm-enable-sjlj.
// - Engines only run the standard (Wasm 3.0) exception format, while LLVM
//   still defaults to the legacy one - hence -wasm-use-legacy-eh=false.
// - The emulation defines unlock signal.h / mman.h / getpid users.

export const WASI_COMPILE_DEFINES = [
    '-D_WASI_EMULATED_SIGNAL',
    '-D_WASI_EMULATED_PROCESS_CLOCKS',
    '-D_WASI_EMULATED_MMAN',
    '-D_WASI_EMULATED_GETPID',
];

export const WASI_EH_CFLAGS = [
    '-mexception-handling',
    '-mllvm', '-wasm-enable-sjlj',
    '-mllvm', '-wasm-use-legacy-eh=false',
];

// Link order matters: wasm-ld resolves left to right, so these must come
// after every archive (libunwind also provides the __cpp_exception tag).
export const WASI_LINK_LIBS = [
    '-lunwind',
    '-lsetjmp',
    '-lwasi-emulated-signal',
    '-lwasi-emulated-process-clocks',
    '-lwasi-emulated-mman',
    '-lwasi-emulated-getpid',
];

export function wasiCFlags() {
    return [...WASI_COMPILE_DEFINES, ...WASI_EH_CFLAGS];
}

export function wasiCxxFlags() {
    return [...WASI_COMPILE_DEFINES, '-fwasm-exceptions', ...WASI_EH_CFLAGS];
}

// system config first (persistent, ~/.cppjs.json), env as an override for
// one-off runs and CI. Returns null when neither is set.
export function resolveWasiSdkPath(system, env = process.env) {
    return env.CPPJS_WASI_SDK_PATH || system?.WASI_SDK_PATH || null;
}
