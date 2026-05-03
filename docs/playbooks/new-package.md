# Playbook — Add a new C++ library as a `cppjs-package`

> **Persona 3** — Package author. The user wants to wrap an existing C++ library so it can be `pnpm add @cpp.js/package-<name>` consumed.

## Goal

Produce a `cppjs-package-<name>` family that:

- Builds for **wasm**, **android**, **ios** with one command.
- Exposes the library to JavaScript through Embind / SWIG bridges.
- Ships with `README.md`, `LICENSE`, `.npmignore`, and a `nativeVersion`-pinned `package.json`.

## When to use

- The user says "I want to use library X (e.g. libsodium, FreeType, …) from JS".
- The user is contributing a new package to the cpp.js ecosystem.
- A `cppjs-package-X` already exists but the user is creating a new arch sub-package (e.g. only `-wasm` exists, they need `-ios`).

## Decision: where does the new package live?

```
Does this package extend or affect GDAL (or another package already in
this monorepo's transitive dep graph)?
│
├─ YES → Add directly to this repo under cppjs-packages/cppjs-package-<name>/
│         Use the @cpp.js/* npm scope.
│
└─ NO  → Author it outside this repo:
          1. Strongly encourage the user to create it under the
             cppjs-community GitHub org and PR upstream once it works.
          2. They can also keep it in their own org. In that case the npm
             package name MUST stay unscoped: `cppjs-package-<name>`
             (NOT `@user/cppjs-package-X`, NOT `@cpp.js/...`).
```

The `@cpp.js/*` scope is reserved for packages reviewed and adopted into this repo. Unscoped `cppjs-package-<name>` is the convention for community-authored packages in user orgs; this lets cpp.js's plugin discovery find them by name pattern.

## Files involved

Mirror the canonical `cppjs-packages/cppjs-package-zlib/` skeleton:

```
cppjs-package-<name>/
├── cppjs-package-<name>/                 ← meta package
│   ├── package.json                      ← name, version 0.1.0, deps to sub-arch packages
│   ├── cppjs.config.js                   ← re-export sub-arch configs
│   ├── README.md
│   ├── LICENSE
│   └── .npmignore
├── cppjs-package-<name>-wasm/
│   ├── package.json                      ← nativeVersion, workspace deps to other -wasm packages
│   ├── cppjs.config.js                   ← env, data, libName, build params
│   ├── cppjs.build.js                    ← source acquisition + cmake/configure invocation
│   ├── assets/CMakeLists.txt             ← (only if upstream needs an override)
│   ├── README.md
│   ├── LICENSE
│   └── .npmignore
├── cppjs-package-<name>-android/         ← same shape as -wasm
└── cppjs-package-<name>-ios/             ← same shape + cppjs-package-<name>.podspec
```

### Required content per file

- **`package.json`** (each sub-arch):
  - `"version": "0.1.0"` for fresh packages.
  - `"nativeVersion": "<upstream version>"` — pinned via `pnpm run check:native`.
  - `"dependencies"`: workspace refs to other `@cpp.js/package-*-<arch>` (or unscoped `cppjs-package-*-<arch>` for community) the library needs to link against. pnpm derives topological build order from this.
- **`cppjs.config.js`**: exported `targetSpecs` array with `env`, `data`, `libName`, optional `cmake.compileOptions`. Function-typed `env` values receive `(state, target)` and resolve at build time.
- **`cppjs.build.js`**: `getSource()` (download/copy/patch upstream), `prepare()` (cmake configure step), `build()` (cmake build / make install). Uses `getCppJsScript`, `run`, etc. from `cpp.js` exports.
- **`cppjs-package-<name>.podspec`** (ios only): CocoaPods manifest. **Always** include `s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }` to keep consumer apps from linking arm64-only iOS simulator slices.
- **`README.md`**: one paragraph intent, `nativeVersion`, license note, install snippet.
- **`LICENSE`**: copy upstream library's license file. cpp.js's package wrapper itself can use a permissive license (MIT) but the bundled native binary's license governs distribution.
- **`.npmignore`**: exclude `.cppjs/`, `dist/<...>/source/`, build intermediates. Keep `dist/prebuilt/` (consumers need the prebuilt artifacts).

## Native version sourcing

Always use the **latest stable** upstream version. Resolution order:

1. **GitHub releases API** (`https://api.github.com/repos/<owner>/<repo>/releases`). Filter out prereleases unless the library only ships prereleases.
2. **GitHub tags API** (`/tags`) — fallback when the project doesn't use Releases.
3. **Project HTML page / download index** — last resort (autotools projects often ship tarballs with no GitHub releases).

Existing helper: `scripts/check-native-versions.js` already implements this resolution chain. Run `pnpm run check:native -- --update` after adding the package to auto-bump (or to write the initial `nativeVersion`).

## Build system preference

1. **CMake first.** If upstream has a `CMakeLists.txt`, use it. Easiest cross-platform story — the cpp.js build pipeline is CMake-native.
2. **autotools (`./configure && make`) fallback.** Use when upstream has no CMake support and porting is too invasive. Requires `state.config.build.buildType = 'configure'` in `cppjs.config.js`. See `cppjs-package-openssl-*` for a reference.
3. **Custom Make / scons / etc.** Last resort; usually means writing a thin CMake wrapper or using `getDependFilePath` + manual shell-out.

## Commands

```bash
# 1. Scaffold (Sprint 4 will add scripts/scaffold-package.js to automate this).
#    For now: copy cppjs-packages/cppjs-package-zlib/ as a starting point.
cp -r cppjs-packages/cppjs-package-zlib cppjs-packages/cppjs-package-<name>
# Then rename every "zlib" reference inside.

# 2. Resolve and write nativeVersion
pnpm run check:native -- --update
# (Manually verify the picked version is sane.)

# 3. Build all arches
pnpm --filter='@cpp.js/package-<name>*' run build
# Or one arch at a time during development:
pnpm --filter=@cpp.js/package-<name>-wasm run build

# 4. (Only if integrating into THIS repo) Add an e2e exercise to a sample
#    that consumes the new package, e.g. cppjs-sample-lib-prebuilt-matrix.
```

## Validation

Required:

- [ ] `pnpm --filter='@cpp.js/package-<name>*' run build` succeeds for wasm, android (Linux/macOS), iOS (macOS only).
- [ ] `pnpm run check:dist` shows the new package as built.
- [ ] Each sub-arch has README + LICENSE + .npmignore + correct podspec (iOS).
- [ ] `nativeVersion` matches latest upstream stable.
- [ ] All transitive C++ deps appear in each sub-arch's `package.json` `dependencies`.

When integrating into this repo (not a community fork):

- [ ] An e2e test exists in a sample that exercises the new package (mirror an existing test in `cppjs-samples/cppjs-playground-*`).
- [ ] `pnpm run e2e:dev && pnpm run e2e:prod` pass.

When the user is keeping the package outside this repo:

- [ ] **Skip the e2e step.** Their own project tests it.
- [ ] Verify the package builds standalone via `pnpm cppjs build` in their package directory.

## Common pitfalls

- **Forgetting `EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64`** in the iOS podspec. Without it, consumer apps fail to link on Apple Silicon Macs running iOS simulator.
- **Missing workspace deps.** If `package-<name>-wasm` doesn't list `package-zlib-wasm` in `dependencies`, pnpm may build them in the wrong order; the linker then fails to find symbols.
- **Mixing scoped and unscoped names.** Stick to one: `@cpp.js/*` for in-repo, plain `cppjs-package-*` for community/user-org. Don't mix.
- **Not pinning `nativeVersion`.** Without a pin, `check:native --update` later overwrites silently and reproducible builds break.
- **`bin/` artifacts in `.npmignore`** — make sure `dist/prebuilt/<target>/lib/lib<name>.a` (and `.so` for android, `.xcframework` for ios) is **not** ignored, or consumers can't link.
- **Wrong upstream license.** The cpp.js wrapper README is permissive but the native binary's license governs distribution. If the upstream is GPL-only, surface this prominently in README and ask the user to confirm intent.
- **Naming collisions in user orgs.** A user can't publish `@cpp.js/package-foo`. They need `cppjs-package-foo` (unscoped, on npm). cpp.js's plugin discovery finds packages matching `*cppjs-package-*` regardless of scope.
- **Recommend over enforce.** The user always picks where to host (their org / cppjs-community / direct PR here). Surface the decision tree, don't force.

## Reference

- Canonical small example: `cppjs-packages/cppjs-package-zlib/`
- CMake-heavy example: `cppjs-packages/cppjs-package-tiff/` (transitive deps: zlib, jpegturbo, zstd, lerc)
- autotools example: `cppjs-packages/cppjs-package-openssl/`
- Big aggregator example: `cppjs-packages/cppjs-package-gdal/` (depends on ~13 other packages)
- Native version checker: `scripts/check-native-versions.js`
- Distribution CMake template: `cppjs-core/cpp.js/src/assets/cmake/dist.cmake`
