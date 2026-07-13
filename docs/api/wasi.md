# WASI — `platform: 'wasi'` command builds

> Compiles the project into a single **WASI command module** (`<name>-wasi-wasm32-st-<buildType>.wasm`): no JS glue, no embind bridge, runnable under any WASI runtime with Wasm 3.0 exception support (wasmtime 37+, run with `-W exceptions=y`).

## Quick start

```bash
# one-time: point cpp.js at an extracted wasi-sdk (>= 25)
#   ~/.cppjs.json →  { "WASI_SDK_PATH": "/opt/wasi-sdk" }
#   or per-run:      CPPJS_WASI_SDK_PATH=/opt/wasi-sdk cppjs build -p wasi

cppjs build -p wasi -b release
wasmtime run -W exceptions=y --dir=. dist/<name>-wasi-wasm32-st-release.wasm arg1
```

Your `src/native` must provide `main(int, char**)` — it is the entry point.
The source archive is linked whole (its code is the root set); dependency
archives are dead-code-eliminated down to what `main` reaches, and the
`export.wholeArchive` escape hatches apply as usual.

## What differs from `platform: 'wasm'`

| | `wasm` (emscripten) | `wasi` (wasi-sdk) |
|---|---|---|
| Output | wasm + JS glue + runtime | single `.wasm` |
| Bindings | embind bridge (swig) | none — `main()` only |
| Filesystem | WASMFS / OPFS / preload | host dirs via `--dir` preopens |
| Data files | `.data.txt` preload | real `dist/data/` folder to preopen |
| Threads | `runtime: 'mt'` (workers) | not yet (wasip1-threads later) |
| Network | FETCH / websocket bridges | none (wasi-sockets later) |
| Prebuilt ABI | emscripten sysroot | **incompatible** — packages need `wasi-wasm32-*` prebuilt variants |

## Toolchain contract (what cpp.js injects)

- Compile (C and C++): `-D_WASI_EMULATED_SIGNAL -D_WASI_EMULATED_PROCESS_CLOCKS -D_WASI_EMULATED_MMAN -D_WASI_EMULATED_GETPID -mexception-handling -mllvm -wasm-enable-sjlj -mllvm -wasm-use-legacy-eh=false` (+ `-fwasm-exceptions` for C++). The `-mexception-handling` target feature is what unlocks wasi-libc's `setjmp.h`; engines only run the standard EH format, hence the legacy toggle.
- Link (after every archive — order matters): `-lunwind -lsetjmp -lwasi-emulated-*`, plus `assets/wasi-runtime/stubs.c` (clean-failing `dlopen` family, no-op `pthread_atfork`).
- Extra flags per target: `targetSpecs.specs.wasiFlags`.

## Limits

No processes, no dynamic loading, no sockets, single-threaded. Anything the
stubs cover fails cleanly at runtime instead of trapping at instantiation.
