# Troubleshooting

When a cpp.js build or runtime error appears, almost every common error has a designated fix that doesn't require editing cpp.js source or generated artifacts. This page lists the errors people hit most often and shows the standard fix for each.

The recovery rule:

1. Read the error literally.
2. Identify which layer it lives in (build / link / binding / runtime / hosting).
3. Apply the **least invasive** fix (target filter → `targetSpecs` → env → build hooks → extensions). See the [overrides catalog](/docs/api/configuration/overrides) for the full hierarchy.

## Build-time errors

### `Error: ENOENT: no such file or directory ... /dist/...`

cpp.js expected a `dist/` folder from a dependency that hasn't been built yet.

- **Cause**: a transitive dep wasn't built. pnpm topological order normally handles this, but if you ran a single-package build with `pnpm --filter <one>` it skipped the deps.
- **Fix**: run a full topological build: `pnpm install && pnpm run build`. Or build the dep first: `pnpm --filter '@cpp.js/package-<dep>*' run build`.

### `undefined symbol: <name>` (linker)

The linker can't find a symbol your code references.

- **Cause A — missing dependency**: `dependencies: []` in `cppjs.config.js` doesn't list the package providing this symbol.
  - **Fix**: add the dep + its sub-arch dep in `package.json`.
- **Cause B — symbol clash**: two libs export the same symbol (common with `iconv`; gdal renames it to `libiconv`).
  - **Fix**: in `cppjs.build.js`, use `replaceList` to rename one set of symbols, or `targetSpecs[].specs.ignoreLibName` to suppress the duplicate.

### `error: cannot find -l<libname>`

Linker can't find a library file even though the dep is declared.

- **Cause**: the library was built but produced a different `.a` name than expected. Usually a mismatch between `export.libName` in the dep and what's actually built.
- **Fix**: check `cppjs-package-<dep>/cppjs-package-<dep>-<arch>/cppjs.config.js` — look at `export.libName`; verify the produced `.a` exists in `dist/lib/`.

### `wasm-ld: error: --whole-archive ... duplicate symbol`

Two libs define the same function.

- **Fix**: same as the symbol-clash case above. `replaceList` rename, or `ignoreLibName` to drop one.

### `__wasm__` / `CPL_CPUID` / `__asm__` / SIMD intrinsic compile errors

Upstream library uses CPU-specific code that doesn't compile for Wasm.

- **Fix**: in `cppjs.build.js`, gate the intrinsic with `#ifdef __wasm__` via `replaceList`. Real example from gdal-wasm:

  ```js
  replaceList: [{
      regex: /CPL_CPUID\(1, cpuinfo\);/g,
      replacement: '#ifdef __wasm__\ncpuinfo[0]=0;\n#else\nCPL_CPUID(1, cpuinfo);\n#endif',
      paths: ['port/cpl_cpu_features.cpp'],
  }]
  ```

### `configure: error: cannot find ...` (autotools project)

`buildType: 'configure'` but the configure script can't find a dep header or library.

- **Fix A**: add the missing dep to `dependencies`. Re-derive `depPaths.X.header` in `getBuildParams`.
- **Fix B**: if your dep is there, `getBuildParams` may need explicit `--with-X=...=${depPaths.X.header}` flags. Verify the dep name in `depPaths` matches the package short name.

### `RuntimeError: index out of bounds` during build

Emscripten itself ran out of memory during compilation (rare).

- **Fix**: bump linker memory via `targetSpecs[].specs.emccFlags: ['-sINITIAL_MEMORY=512MB']`.

### iOS: `pipe2 was misdetected as available`

curl-ios SDK 26+ specific.

- **Cause**: autoconf cache miss between SDK detection and actual symbol availability.
- **Fix**: `getBuildParams` adds `'-D_CURL_PREFILL=ON'`. See curl-ios's `cppjs.build.js` for the prefill cache pattern.

### iOS: code signing fails on a build utility

Upstream lib has a tool that's built and signed, but you don't have a dev cert.

- **Fix**: `targetSpecs[].specs.cmake: ['-DCMAKE_XCODE_ATTRIBUTE_CODE_SIGNING_ALLOWED=NO']`. Real example: jpegturbo-ios for the SIMD coverage tool.

## Binding-time errors

### Function silently returns `null` or `undefined`

Your C++ function violated a binding rule. See [C++ binding rules](/docs/api/cpp-bindings/overview).

Common causes:

- Returning `unique_ptr` instead of `shared_ptr`. Switch to `shared_ptr`.
- Returning a raw pointer (`MyClass*`). Wrap in `shared_ptr` or write a C++ wrapper.
- Using multiple inheritance. Refactor to composition.
- Template not explicitly instantiated. Add `template class X<int>;`.
- Definition only in `.cpp`, not in `.h`. Move at least the public surface into the header.

### `Error: Tried to call ... but the function is not exposed`

Function isn't in the public binding surface.

- **Cause A**: function is in an anonymous namespace or `static` at file scope. Move it to public surface.
- **Cause B**: declared in `.h` but defined in `.cpp` with a `static` or `inline` qualifier the binder skips. Match declaration and definition.

### SWIG generation failures (`%feature` errors, `Unable to find ...`)

Auto-generated `.i` doesn't fit. Write a manual one — see [SWIG escape hatch](/docs/api/cpp-bindings/swig-escape).

## Runtime errors

### Browser console: `crossOriginIsolated is false`

You set `target.runtime: 'mt'` but production hosting isn't sending COOP/COEP headers.

- **Fix**: add `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` to your host config. See the [threading guide](/docs/api/configuration/threading) for the per-host table.

### `RuntimeError: SharedArrayBuffer is not defined`

Same root cause as above — COOP/COEP missing.

### `OPFS is only available inside a Worker scope`

You mounted `/opfs/...` but didn't set `useWorker: true` on `initCppJs(opts)`.

- **Fix**: `initCppJs({ useWorker: true })`. See the [filesystem guide](/docs/api/javascript/filesystem).

### `Path /opfs/... but OPFS is disabled. Enable fs.opfs in config`

You explicitly set `fs: { opfs: false }` and then tried to use `/opfs/...`.

- **Fix**: either remove the `opfs: false` (it's `true` by default) or mount under `/memfs/...`.

### `RuntimeError: out of memory` (Wasm)

The Wasm process exhausted its allocated heap.

- **Note**: `-sALLOW_MEMORY_GROWTH=1` is on by default — runtime should grow memory automatically up to host limits.
- **Fix A — initial allocation**: `targetSpecs[].specs.emccFlags: ['-sINITIAL_MEMORY=128MB']`. Bump default starting size.
- **Fix B — maximum allocation**: `targetSpecs[].specs.emccFlags: ['-sMAXIMUM_MEMORY=4GB']`. Browser cap is ~4GB on wasm32; switch to wasm64 target if you need more.
- **Fix C — algorithmic**: stream the input instead of loading all into memory. Most "out of memory" cases mean your design holds too much state at once.

### `m.someFunc is undefined`

The C++ function exists but didn't bind to JS.

- **Cause A**: binding rule violation. See "Binding-time errors" above.
- **Cause B**: the JS module finished loading but `initCppJs` hasn't completed. Make sure you call `m.someFunc` *after* `await initCppJs(...)`.

### Calls hang forever when `useWorker: true`

A Comlink call was posted to the worker but no response came back.

- **Cause A**: worker script URL is wrong; worker never spawned. Check the Network tab — there should be a request to the worker `.js`.
- **Cause B**: C++ inside the worker is in an infinite loop. Open the Sources tab on the worker context.

## Cross-cutting symptoms

### `wasm streaming compile failed`

- **Cause A — wrong MIME type**: some hosts serve `.wasm` as `application/octet-stream` instead of `application/wasm`.
  - **Fix**: configure your host to set the right MIME.
- **Cause B — mixed `mt` and `st` artifacts**: the runtime tries to load a `mt` `.wasm` with an `st` JS loader (or vice versa).
  - **Fix**: clean rebuild after changing `runtime`. `pnpm clear:cache && pnpm clear:dist`, then rebuild.

### Build "works" but produces no output

- **Cause**: `functions.isEnabled: () => false` accidentally returned false for everything.
- **Cause**: `target.platform` filter is set to a value that doesn't match any built-in target.
- **Fix**: check the build log for `Skipping target: ...` lines.

### Hot Module Reload doesn't pick up `.cpp` changes (Vite/Webpack)

- **Cause**: `paths.native` change not detected by the bundler's file watcher.
- **Note**: the bundler plugins (`@cpp.js/plugin-vite`, `@cpp.js/plugin-webpack`) explicitly add the `paths.native` files to the watcher in dev mode.
- **Fix**: restart the dev server. If it persists, check that `paths.native` is correctly resolved.

## Tribal-knowledge gotchas

These are patterns the source code uses but aren't obvious. Worth knowing about up front.

### `iconv` symbol collision in gdal

When you depend on both `gdal` and another transitive lib that uses `libiconv`, symbols clash. gdal uses a `replaceList` entry to prefix iconv calls. If you write a new package that also uses iconv, mirror the pattern.

### `emscripten_fetch` swap in curl-wasm

curl's POSIX socket calls don't exist in Wasm. curl-wasm injects a 200-line `replaceList` swap to use Emscripten's `fetch` API. If you ship any HTTP-using package for Wasm, you'll need the same swap (or use curl as a dep).

### CPU intrinsic gates

`CPL_CPUID`, `__asm__`, `<immintrin.h>` and similar don't compile for Wasm by default. gdal-wasm gates them with `#ifdef __wasm__`. Pattern is in gdal's `cppjs.build.js`.

### `depPaths` silent fallback

When `getBuildParams` references `depPaths.X.header` with a wrong key name (typo or rename), CMake silently falls back to the system header search path. The build "succeeds" but uses the wrong header. **Always verify the dep name in `depPaths` matches the package short name** (the `general.name` of the dep).

### iOS `_CURL_PREFILL` cache

On iOS SDK 26+, autoconf misdetects `pipe2` due to a cache mismatch. curl-ios uses `_CURL_PREFILL=ON` to force-load a prefill script. Any autotools-based package on iOS may hit similar cache issues.

## Diagnostic flow

When the error doesn't match anything above:

1. **`pnpm run doctor`** — verifies Node, pnpm, Docker, Android SDK/NDK, Xcode. Most "weird" build failures are missing toolchains.
2. **Set `~/.cppjs.json` `LOG_LEVEL: 'DEBUG'`** — turns on verbose tracing in cpp.js itself. Often shows which step failed.
3. **Reduce to smallest reproducer** — create a fresh project with just the failing dep.
4. **Search for the error literal** in `cppjs-core/cpp.js/src/`. Most cpp.js error messages are unique enough to find the throwing site.
5. **File an issue** if the error originates from cpp.js itself, not from your config or upstream. See [report a bug](/docs/contribute/contribute/report-a-issue).

## See also

- [Threading guide](/docs/api/configuration/threading) — COOP/COEP and edge-runtime limits.
- [Filesystem guide](/docs/api/javascript/filesystem) — OPFS / memfs runtime errors.
- [Override mechanisms](/docs/api/configuration/overrides) — full catalog of where each fix lives.
- [Performance defaults](/docs/api/configuration/performance) — what's safe to override and what to leave alone.
