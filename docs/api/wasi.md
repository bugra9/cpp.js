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

## Prebuilt packages

Every library package except curl and openssl has a dedicated wasi platform
package — `@cpp.js/package-<name>-wasi`, next to its `-wasm`/`-android`/
`-ios` siblings — carrying the `wasi-wasm32-st-release` prebuilt: zlib,
sqlite3, tiff, geotiff, proj, gdal, jpegturbo, zstd, lerc, webp, expat,
geos, iconv and spatialite. curl needs sockets (none on WASI) and openssl
only makes sense as a crypto-only custom build - both are deliberately out
for now.

Depend on the `-wasi` variant when targeting wasi; `pnpm build` inside such
a package refreshes its prebuilt under the same wasi-sdk requirement as app
builds. GDAL's `__wasi__` source patches (no processes, no `mkstemp`)
travel inside its recipe, so a plain `cppjs build -p wasi` is all that is
needed.

Each `-wasi` package ships a standalone use case under `e2e/` (`pnpm e2e`,
or `pnpm e2e:wasi` at the repo root): a small C program is compiled against
the shipped archives and run under wasmtime - zlib/zstd roundtrips, a
sqlite file database, a deflate tif, geokeys, an EPSG:4326→3857 transform
through proj.db, jpeg/webp encodes, an expat parse, a geos intersection, an
iconv conversion and a spatialite `MakePoint`. The scripts SKIP politely
when the wasi-sdk, wasmtime or the prebuilt is absent.

## Limits

No processes, no dynamic loading, no sockets, single-threaded. Anything the
stubs cover fails cleanly at runtime instead of trapping at instantiation.
