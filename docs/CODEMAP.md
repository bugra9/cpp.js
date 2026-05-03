# cpp.js — Codemap

> Concept → file pointers. When you know **what** you want to change, find **where** to change it here.
> Pair with `ARCHITECTURE.md` for the high-level mental model.

## Top-level layout

```
cpp.js/
├── AGENTS.md                         ← agent entrypoint (read first)
├── docs/                             ← agent-context docs (this file lives here)
│   ├── ARCHITECTURE.md               ← high-level mental model
│   ├── CODEMAP.md                    ← concept → file pointer (this file)
│   ├── adr/                          ← architecture decision records (why-we-chose-X)
│   ├── api/                          ← runtime + build API reference (initCppJs, cppjs.config.js, fs, threading)
│   └── playbooks/                    ← per-persona / per-framework workflows
├── .github/                          ← workflows, PR + issue templates
├── scripts/                          ← repo-level Node CLIs (check-*, doctor.sh, …)
├── package.json                      ← root scripts: build, clear, ci:*, e2e, publish, check
├── pnpm-workspace.yaml               ← workspace globs
├── cppjs-core/
│   ├── cpp.js/                       ← the CLI + build orchestration (most-touched)
│   └── cppjs-core-embind-jsi/        ← Embind/JSI helper used by RN bridge
├── cppjs-plugins/
│   ├── cppjs-plugin-vite/
│   ├── cppjs-plugin-webpack/
│   ├── cppjs-plugin-rollup/
│   ├── cppjs-plugin-react-native/
│   ├── cppjs-plugin-metro/
│   └── cppjs-plugin-react-native-ios-helper/
├── cppjs-packages/
│   └── cppjs-package-<name>/
│       ├── cppjs-package-<name>/         ← meta package
│       ├── cppjs-package-<name>-wasm/    ← per-arch sub-packages
│       ├── cppjs-package-<name>-android/
│       └── cppjs-package-<name>-ios/
├── cppjs-samples/                    ← reference integrations + canonical examples
└── website/                          ← Docusaurus public site
```

## "What options does the runtime / config accept?" → API reference

Every consumer-facing field, every default, every constraint lives in [`docs/api/`](./api/):

- [`init.md`](./api/init.md) — `initCppJs(opts)` runtime API, Module helpers.
- [`cppjs-config.md`](./api/cppjs-config.md) — `cppjs.config.js` field-by-field (build-time, every consumer).
- [`cppjs-build.md`](./api/cppjs-build.md) — `cppjs.build.js` lifecycle hooks (package authors only).
- [`filesystem.md`](./api/filesystem.md) — OPFS / memfs / node-fs / edge fs decision tree, including the `useWorker` requirement for OPFS.
- [`threading.md`](./api/threading.md) — `runtime: 'st' | 'mt'`, `useWorker`, COOP/COEP, edge-runtime limits.
- [`cpp-binding-rules.md`](./api/cpp-binding-rules.md) — what auto-binding handles + wrapper / SWIG escape patterns.
- [`swig-escape.md`](./api/swig-escape.md) — manual `.i` files for the rare cases auto-gen doesn't fit.
- [`build-state.md`](./api/build-state.md) — `state` and `target` shapes + 20 built-in target inventory.
- [`overrides.md`](./api/overrides.md) — 20 override mechanisms (least → most invasive).
- [`troubleshooting.md`](./api/troubleshooting.md) — common errors mapped to fixes.
- [`performance.md`](./api/performance.md) — default flag reference + safe-override guide.
- [`lifecycle-and-types.md`](./api/lifecycle-and-types.md) — JS-side memory + TypeScript notes.

Index + decision tree: [`docs/api/README.md`](./api/README.md).

Playbooks added in Sprint 9:

- [`playbooks/code-review.md`](./playbooks/code-review.md) — review checklist for package + fix/feature PRs.
- [`playbooks/verify-install.md`](./playbooks/verify-install.md) — verify your plugin / MCP / AGENTS.md install actually works.

## "Why was X decided this way?" → architecture decisions

Load-bearing decisions live in `docs/adr/`. Read the relevant ADR before changing the affected surface:

- [ADR-0001](./adr/0001-agent-first-class-support.md) — AI agents are first-class consumers (driving the plugin / MCP / playbooks investment).
- [ADR-0002](./adr/0002-pnpm-topological-build-order.md) — pnpm workspace deps drive C++ link order.
- [ADR-0003](./adr/0003-function-typed-env-values.md) — `env` values can be functions of `(state, target)`.
- [ADR-0004](./adr/0004-three-layer-agent-distribution.md) — Plugin / MCP / AGENTS.md snippet, why three.

Index + template: [`docs/adr/README.md`](./adr/README.md).

## "I want to change X" → look here

### Build orchestration (`cppjs-core/cpp.js/`)

| Concept | File |
|---------|------|
| CLI entry, command parsing | `src/bin.js` |
| Per-target static lib build | `src/actions/createLib.js` |
| Wasm linking + JS loader gen | `src/actions/buildWasm.js` |
| Rollup config for runtime adapters | `src/actions/buildJs.js` |
| iOS xcframework assembly | `src/actions/createXCFramework.js` |
| CMake parameter generation | `src/actions/getCmakeParameters.js` |
| Docker / Xcode shell-out | `src/actions/run.js` |
| Bridge file generation (SWIG) | `src/actions/createInterface.js` |
| Native version mtime check (force trigger) | `src/actions/isSourceNewer.js` |
| Resolve transitive C++ deps | `src/actions/getDependLibs.js` |
| Aggregate `env`/`data`/`cmake` per target | `src/actions/getData.js` |
| Target matrix + filtering | `src/actions/target.js` |
| Plugin extension hooks | `src/actions/extensions.js` |

### Configuration + state

| Concept | File |
|---------|------|
| Merge `cppjs.config.*` + defaults | `src/state/loadConfig.js` |
| Runtime config singleton | `src/state/index.js` |
| Default ext lists, paths.\*, dependency graph | `src/state/loadConfig.js` |

### Runtime (JS) layer

| Concept | File |
|---------|------|
| Shared core (createInitCppJs, mergeDeep, locateFile, …) | `src/assets/js-runtime/core.js` |
| Browser shim (composes URL path + browser FS + worker) | `src/assets/js-runtime/browser.js` |
| Node shim (composes fs path + node FS) | `src/assets/js-runtime/node.js` |
| Edge shim (Cloudflare Workers, etc.) | `src/assets/js-runtime/edge.js` |
| URL-style locateFile | `src/assets/js-runtime/adapters/path-url.js` |
| FS path locateFile (factory) | `src/assets/js-runtime/adapters/path-fs.js` |
| Browser FS (OPFS, autoMount) | `src/assets/js-runtime/adapters/fs-browser.js` |
| Node FS helpers | `src/assets/js-runtime/adapters/fs-node.js` |
| Comlink + Embind worker bridge | `src/assets/js-runtime/adapters/worker-comlink.js` |

### C++ runtime

| Concept | File |
|---------|------|
| Browser entrypoint | `src/assets/cpp-runtime/browser.cpp` |
| Node entrypoint | `src/assets/cpp-runtime/node.cpp` |
| Shared bridge code | `src/assets/cpp-runtime/commonBridges.cpp` |
| Empty-source placeholder (silences ranlib) | `src/assets/cpp-runtime/cppjsEmptySource.cpp` |

### CMake infrastructure

| Concept | File |
|---------|------|
| Top-level CMakeLists template | `src/assets/cmake/CMakeLists.txt` |
| Distribution CMake template (consumer-side) | `src/assets/cmake/dist.cmake` |
| iOS toolchain reference (legacy) | `src/assets/cmake/ios.toolchain.cmake` |

### Packaging

| Concept | File |
|---------|------|
| iOS package podspec template | `src/assets/packaging/cppjs-package.podspec` |

### Utilities

| Concept | File |
|---------|------|
| Structured logger (TTY-aware, colored) | `src/utils/logger.js` |
| Filesystem helpers (findFiles, getParentPath) | `src/utils/{findFiles,getParentPath,getAbsolutePath}.js` |
| JSON I/O | `src/utils/{loadJson,writeJson}.js` |
| JS module loading | `src/utils/loadJs.js` |
| Content-hash for cache keys | `src/utils/hash.js` |
| Docker image pull | `src/utils/pullDockerImage.js` |
| Download + extract sources | `src/utils/downloadAndExtractFile.js` |
| System config schema | `src/utils/systemKeys.js` |

## Plugins (`cppjs-plugins/`)

| Plugin | Entry | What it does |
|--------|-------|--------------|
| `cppjs-plugin-rollup` | `index.js` | Inner kernel: rollup transform for `.h`, watch native paths, build on `generateBundle` |
| `cppjs-plugin-vite` | `index.js` | Wraps `cppjs-plugin-rollup`; dev/preview servers with COOP/COEP, HMR force-rebuild |
| `cppjs-plugin-webpack` | `index.js` | Webpack/Rspack equivalent; dev-server middleware + COOP/COEP |
| `cppjs-plugin-react-native` | `index.js`, `script/build_{android,ios,js}.js`, `cpp/CMakeLists.txt` | RN integration: Gradle CMake hook, podspec hook |
| `cppjs-plugin-react-native-ios-helper` | (small helper) | iOS-side RN glue |
| `cppjs-plugin-metro` | (small bundler hook) | Metro bundler integration |

## Packages (`cppjs-packages/`)

Each `cppjs-package-<name>/<name>-<arch>/` has the same skeleton:

| File | Purpose |
|------|---------|
| `package.json` | npm metadata + `nativeVersion` + workspace deps to other `@cpp.js/package-*-<arch>` |
| `cppjs.config.js` | exported targetSpecs (env, data, libName, build params) |
| `cppjs.build.js` | source acquisition (URL, copy, patches), CMake/configure invocation |
| `assets/CMakeLists.txt` *(if needed)* | per-package CMake override |
| `cppjs-package-<name>.podspec` *(ios only)* | CocoaPods manifest with `EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64` |
| `README.md` | one-paragraph intent + license note |
| `LICENSE` | upstream library license |
| `.npmignore` | exclude `.cppjs/`, `dist/.../source/`, etc. from publish |

To add a new `cppjs-package-X`: see `docs/playbooks/new-package.md` (uses `cppjs-package-zlib` as the canonical reference).

## Samples (`cppjs-samples/`)

| Sample | Use as reference for |
|--------|----------------------|
| `cppjs-sample-web-vue-vite` | Vite + Vue integration |
| `cppjs-sample-web-react-vite` | Vite + React |
| `cppjs-sample-web-svelte-vite` | Vite + Svelte |
| `cppjs-sample-web-react-rspack` | Rspack/Webpack + React |
| `cppjs-sample-web-vanilla` | Plain HTML + bundler-less |
| `cppjs-sample-backend-nodejs-wasm` | Node.js consumer |
| `cppjs-sample-cloud-cloudflare-worker` | Cloudflare Worker / edge |
| `cppjs-sample-mobile-reactnative-cli` | RN-cli (canonical mobile reference; CI uses `ci/cppjs-snapshot/`) |
| `cppjs-sample-mobile-reactnative-expo` | RN with Expo |
| `cppjs-sample-lib-prebuilt-matrix` | Minimal C++ library packaging (no UI) — canonical for Persona 3 |
| `cppjs-playground-*` | Bigger demos against multiple `@cpp.js/package-*` (curl, gdal, geos, …) |

## Repo-level scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `check-dist.js` | Verify each package has prebuilt artifacts for expected targets |
| `check-external-dependencies.js` | npm dep version drift (use `--check`/`--update`) |
| `check-native-versions.js` | Native lib version drift via GitHub/registry/HTML scrape (use `--check`/`--update`) |
| `check-beta-status.js` | npm beta tag inventory + `--bump` |
| `detect-framework.js` *(Sprint 2)* | Identify the user's project framework from package.json deps + filesystem signatures |
| `doctor.sh` *(Sprint 4)* | Toolchain readiness (Node, pnpm, Docker, emscripten, NDK, Xcode) |
| `scaffold-package.js` *(Sprint 4)* | Generate a new `cppjs-package-<name>` skeleton |
| `help.js` *(Sprint 2)* | `pnpm run help` — grouped, annotated script listing |

All `check:*` and `clear:*` are exposed as `pnpm run` aliases — see `package.json`.

## CI workflows (`.github/workflows/`)

| Workflow | What runs |
|----------|-----------|
| `build-linux.yml` | `pnpm install` → `pnpm run ci:linux:build` → `e2e:prod` |
| `build-macos.yml` | `pnpm run ci:macos:build` (iOS samples + zlib-ios) |
| `build-windows.yml` | `pnpm run ci:windows:build` (wasm + android subset) |
| `test-android-sample.yml` | RN-cli Android E2E |
| `test-ios-sample.yml` | RN-cli iOS E2E (uses `ci/cppjs-snapshot/` bridge fixtures) |
| `deploy-website.yml` | Build + deploy Docusaurus site |

## Common recipes

### "Add a new C++ library as a cppjs-package"

1. Read `docs/playbooks/new-package.md`.
2. Mirror `cppjs-packages/cppjs-package-zlib/` (smallest, simplest).
3. Add workspace deps in each sub-arch's `package.json` to its native deps.
4. Run `pnpm --filter=@cpp.js/package-<name>* run build`.

### "Support a new bundler"

1. Read `cppjs-plugins/cppjs-plugin-vite/index.js` (most-evolved reference).
2. Mirror in a new `cppjs-plugins/cppjs-plugin-<bundler>/`.
3. Provide: dev/preview server middleware (COOP/COEP), watch-rebuild hook, transform for `.h` files (delegate to `cppjs-plugin-rollup`).

### "Add a runtime adapter (Deno, Bun, etc.)"

1. Read `cppjs-core/cpp.js/src/assets/js-runtime/core.js` (the contract).
2. Add `<runtime>.js` shim composing the right adapters from `js-runtime/adapters/`.
3. Add the runtime to `cppjs-core/cpp.js/src/state/index.js` target matrix if a new `runtimeEnv` is needed.
4. Update `cppjs-core/cpp.js/src/actions/buildJs.js` rollup options if the bundle format differs.

### "Bump a native library's version"

1. `pnpm run check:native` to see drift.
2. `pnpm run check:native -- --update` to auto-bump `nativeVersion` in every affected `package.json`.
3. `pnpm --filter=@cpp.js/package-<name>* run build` to verify.

### "Fix a build pipeline bug"

1. Reproduce locally with the smallest sample (often `cppjs-sample-lib-prebuilt-matrix` or `cppjs-sample-backend-nodejs-wasm`).
2. Adjust `cppjs-core/cpp.js/src/actions/<file>.js` per the codemap above.
3. Validation: `pnpm run ci:linux:build && pnpm run e2e:dev && pnpm run e2e:prod`.

### "Integrate cpp.js into my own project"

→ `docs/playbooks/integration/README.md` (decision tree + per-framework playbooks).
