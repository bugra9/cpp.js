# cpp.js

## 2.0.0-beta.35

### Patch Changes

- **wasi runner: a platform's env no longer replaces the shared one** — a recipe declares its
  environment once for every platform and adds per-platform knobs on top, but the runner merged
  the blocks with a shallow `Object.assign`, so the wasi block's `env` dropped the shared one.
  Every `gdal*-wasi` command therefore ran without `GDAL_DATA` (and said so) even though the
  data directory was mounted. `data` and `env` now merge key by key.

## 2.0.0-beta.34

### Patch Changes

- **`decompress` and `follow-redirects` are gone** — upstream archives are extracted with the
  system `tar` and downloaded with `fetch`, which follows redirects itself. That drops an
  unfixable critical advisory (CVE-2026-53486, zip-slip; upstream unmaintained since 2020) and
  a package with five advisories in its history from every consumer's tree.
- **Source downloads require https** — the scheme is asserted before the request and again on
  the final URL, so a redirect cannot downgrade the transport. Loopback stays exempt for tests.

## 2.0.0-beta.33

### Minor Changes

- **`platform: 'wasi'`** — compile a project into a single WASI command component
  (`wasm32-wasip3`, runs under wasmtime 47+). Dual-mode toolchain: host wasi-sdk via
  `WASI_SDK_PATH` / `CPPJS_WASI_SDK_PATH`, or zero-config inside the digest-pinned
  docker image. New `targetSpecs.specs.wasiFlags`; data lands in a real `dist/data/`
  folder. See `docs/api/wasi.md`.
- **Rust bindings, first-class** — import plain Rust like a C++ header: direct crate
  imports via the `cargo:` scheme (`import { Uuid } from 'cargo:uuid'`, declared in
  the top-level `cargoDependencies` map), app-local `.rs` sources, and whole-crate
  packages via `export.type: 'cargo'`. The engine does not depend on the binding
  layer — consumers (or the bundler plugins) declare `@cpp.js/core-embind-rust`.
  TypeScript declarations are generated under `.cppjs/` (never in your source
  tree) and wired by the shared `@cpp.js/typescript-config` package - add one
  `"extends": "@cpp.js/typescript-config"` line (TS 5.5+) and never manage
  the wiring by hand. See `docs/api/rust.md`.
- **`-bin` tool engine** — a recipe-declared `bin` map drives everything a
  `-bin-wasi` package ships: generated `<tool>-wasi` npm command shims over the
  in-engine runner (`src/runtime/wasiRun.mjs` — mounts and guest env resolved from
  the config graph at call time), a derived `.npmignore`, a pure-data
  `cppjs-bin.json` and an optional multicall multitool binary.
- **TypeScript declarations for C++ `.h` imports** — the bridge step now emits a
  best-effort `.d.ts` per imported header (classes, constructors, method
  signatures; unparsed members fall back to `any`) into the `.cppjs/types/`
  mirror, alongside the Rust declarations - both wired by
  `@cpp.js/typescript-config`. A top-level `dts: 'sync' | 'promise'` config
  field picks the flavor: `'promise'` wraps every generated return for
  `useWorker`-style async runtimes (constructors stay sync-typed; write
  `await new X(...)`). Packages can publish their types: `types: true` emits
  one combined declaration over every public header into
  `dist/types/index.d.ts` and wires package.json `types`/`typesVersions`
  automatically. std::vector crosses as a typed `CppVector<T>`; shared_ptr
  returns resolve to `X | null`.
- **`cppjs licenses`** — list bundled native dependencies with SPDX expressions,
  write derived `THIRD-PARTY-LICENSES.md` notices and CycloneDX SBOMs
  (`--notices` / `--sbom` / `--check`); `--platform` additionally rows up vendored
  copies (recipe `bundled` map) and the statically linked wasi toolchain runtime.
- **Provenance + derived license for `-bin` packages** — every wasi build stamps a
  machine-readable `cppjs.provenance` block (recipe, source sha256, build
  environment, SBOM pointer) and derives the npm `license` field as the AND of all
  effective component licenses, plus a derived root `LICENSE` (the same
  expression followed by every component's full license text - built from the
  same rows as the NOTICE and SBOM).

## 2.0.0-beta.26

**Potentially breaking — `VectorUChar`.** The shared runtime (`commonBridges.cpp`) now
registers `std::vector<unsigned char>` as `VectorUChar` for every target (wasm and the
native JSI runtimes). If your own code — or a wrapped library such as gdal3.js —
already registers `VectorUChar` locally, remove that registration before upgrading:
embind aborts initialisation when the same vector name is registered twice.

## 2.0.0-beta

The 2.0.0 line is a ground-up rework — native iOS/Android via JSI, multi-bundler
plugins (Vite, Rollup, Webpack, Metro), an MCP server, and per-library
`@cpp.js/package-*` families — published on the `beta` dist-tag. Per-release
notes for the beta line are tracked in the git history and on npm until 2.0
stabilises; the entries below cover the 1.x line.

## 1.0.4

### Patch Changes

- fix: workaround for race condition with turbomodule in android.

## 1.0.1

### Patch Changes

- fix: include prebuilt/_/_config.general.name_/_.h in dependency header search paths

## 1.0.0

### Major Changes

- 🚀 first stable release

## 1.0.0-beta.33

### Patch Changes

- chore: add initial version of CHANGELOGS files
