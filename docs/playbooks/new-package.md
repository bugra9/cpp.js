# Playbook — Add a new C++ library as a `crossbind-package`

> **Persona 3** — Package author. The user wants to wrap an existing C++ library so it can be `pnpm add @crossbind/port-<name>` consumed.

## Goal

Produce a `ports/<name>` family that:

- Builds for **wasm**, **android**, **ios** (and, where it makes sense, **wasi**) with one command.
- Exposes the library to JavaScript through Embind / SWIG bridges.
- Ships with `README.md`, `LICENSE`, `.npmignore`, and a `nativeVersion`-pinned `package.json`.
- Declares its upstream license truth in the family manifest (`crossbind.upstream.license` — contract D in `ports/README.md`) so `crossbind licenses` can derive NOTICE/SBOM instead of anyone hand-writing them.

## When to use

- The user says "I want to use library X (e.g. libsodium, FreeType, …) from JS".
- The user is contributing a new package to the crossbind ecosystem.
- A `ports/<X>` family already exists but the user is creating a new arch sub-package (e.g. only `-wasm` exists, they need `-ios`).

## Decision: where does the new package live?

```
Does this package extend or affect GDAL (or another package already in
this monorepo's transitive dep graph)?
│
├─ YES → Add directly to this repo under ports/<name>/
│         Use the @crossbind/* npm scope.
│
└─ NO  → Author it outside this repo:
          1. Strongly encourage the user to create it under the
             crossbind-community GitHub org and PR upstream once it works.
          2. They can also keep it in their own org. In that case the npm
             package name MUST stay unscoped: `crossbind-port-<name>`
             (NOT `@user/port-<name>`, NOT `@crossbind/...`).
```

The `@crossbind/*` scope is reserved for packages reviewed and adopted into this repo. Unscoped `crossbind-port-<name>` is the convention for community-authored packages in user orgs; this lets crossbind's plugin discovery find them by name pattern.

## Files involved

Mirror the canonical `ports/zlib/` skeleton:

```
ports/<name>/
├── base/                                 ← brand package (@crossbind/port-<name>)
│   ├── package.json                      ← name, version 0.1.0, deps to sub-arch packages
│   ├── crossbind.config.js                   ← re-export sub-arch configs
│   ├── README.md
│   ├── LICENSE
│   └── .npmignore
├── wasm/
│   ├── package.json                      ← nativeVersion, workspace deps to other -wasm packages
│   ├── crossbind.config.js                   ← env, data, libName, build params
│   ├── crossbind.build.js                    ← source acquisition + cmake/configure invocation
│   ├── assets/CMakeLists.txt             ← (only if upstream needs an override)
│   ├── README.md
│   ├── LICENSE
│   └── .npmignore
├── android/                              ← same shape as wasm/
├── ios/                                  ← same shape + crossbind-port-<name>.podspec
├── wasi/                                 ← optional: wasi (wasm32-wasip3) prebuilt, same shape
└── bin-wasi/                             ← optional: upstream CLI as npm commands (bin map in
                                             the recipe; governed by ports/README.md)
```

In this repo the recipe body lives once in the family package (`build.mjs`
with `getURL`, `sha256`, `replaceList`, …) and each variant's
`crossbind.build.js` imports and spreads it — platform differences stay in the
variant file.

### Required content per file

- **`package.json`** (each sub-arch):
  - `"version": "0.1.0"` for fresh packages.
  - `"nativeVersion": "<upstream version>"` — pinned via `pnpm run check:native`.
  - `"dependencies"`: workspace refs to other `@crossbind/port-*-<arch>` (or unscoped `crossbind-port-*-<arch>` for community) the library needs to link against. pnpm derives topological build order from this.
- **`crossbind.config.js`**: exported `targetSpecs` array with `env`, `data`, `libName`, optional `cmake.compileOptions`. Function-typed `env` values receive `(state, target)` and resolve at build time.
- **`crossbind.build.js`**: `getSource()` (download/copy/patch upstream), `prepare()` (cmake configure step), `build()` (cmake build / make install). Uses `getCrossbindScript`, `run`, etc. from `crossbind` exports.
- **`crossbind-port-<name>.podspec`** (ios only): CocoaPods manifest. **Always** include `s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }` to keep consumer apps from linking arm64-only iOS simulator slices.
- **`README.md`**: one paragraph intent, `nativeVersion`, license note, install snippet.
- **`LICENSE`**: copy upstream library's license file. crossbind's package wrapper itself can use a permissive license (MIT) but the bundled native binary's license governs distribution.
- **`.npmignore`**: exclude `.crossbind/`, `dist/<...>/source/`, build intermediates. Keep `dist/prebuilt/` (consumers need the prebuilt artifacts).

## Native version sourcing

Always use the **latest stable** upstream version. Resolution order:

1. **GitHub releases API** (`https://api.github.com/repos/<owner>/<repo>/releases`). Filter out prereleases unless the library only ships prereleases.
2. **GitHub tags API** (`/tags`) — fallback when the project doesn't use Releases.
3. **Project HTML page / download index** — last resort (autotools projects often ship tarballs with no GitHub releases).

Existing helper: `scripts/check-native-versions.js` already implements this resolution chain. Run `pnpm run check:native -- --update` after adding the package to auto-bump (or to write the initial `nativeVersion`).

## Build system preference

1. **CMake first.** If upstream has a `CMakeLists.txt`, use it. Easiest cross-platform story — the crossbind build pipeline is CMake-native.
2. **autotools (`./configure && make`) fallback.** Use when upstream has no CMake support and porting is too invasive. Requires `state.config.build.buildType = 'configure'` in `crossbind.config.js`. See `ports/openssl/` for a reference.
3. **Custom Make / scons / etc.** Last resort; usually means writing a thin CMake wrapper or using `getDependFilePath` + manual shell-out.

## Commands

```bash
# 1. Scaffold: scripts/scaffold-package.js generates the skeleton, or copy
#    ports/zlib/ as a starting point.
node scripts/scaffold-package.js <name>
# (manual route: cp -r ports/zlib ports/<name>
#  then rename every "zlib" reference inside.)

# 2. Resolve and write nativeVersion
pnpm run check:native -- --update
# (Manually verify the picked version is sane.)

# 3. Build all arches
pnpm --filter='@crossbind/port-<name>*' run build
# Or one arch at a time during development:
pnpm --filter=@crossbind/port-<name>-wasm run build

# 4. (Only if integrating into THIS repo) Add an e2e exercise to a sample
#    that consumes the new package, e.g. examples/lib-prebuilt-matrix.
```

## Validation

Required:

- [ ] `pnpm --filter='@crossbind/port-<name>*' run build` succeeds for wasm, android (Linux/macOS), iOS (macOS only).
- [ ] `pnpm run check:dist` shows the new package as built.
- [ ] Each sub-arch has README + LICENSE + .npmignore + correct podspec (iOS).
- [ ] `nativeVersion` matches latest upstream stable; the recipe carries the tarball `sha256`.
- [ ] All transitive C++ deps appear in each sub-arch's `package.json` `dependencies`.
- [ ] The family manifest declares `crossbind.upstream.license` (declared/selected/files) and `crossbind licenses --check` passes.
- [ ] Consider `types: true` (+ `dts: 'promise'` for worker-first packages) so consumers get generated TypeScript for `'<pkg>/<header>.h'` imports.
- [ ] `node scripts/check-publish-hygiene.js` passes (K1: no executable leaks; K4 gates apply if a `-bin` package exists).

When integrating into this repo (not a community fork):

- [ ] An e2e test exists in a sample that exercises the new package (mirror an existing test in `e2e/*`).
- [ ] `pnpm run e2e:dev && pnpm run e2e:prod` pass.

When the user is keeping the package outside this repo:

- [ ] **Skip the e2e step.** Their own project tests it.
- [ ] Verify the package builds standalone via `pnpm crossbind build` in their package directory.

## Common pitfalls

- **Forgetting `EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64`** in the iOS podspec. Without it, consumer apps fail to link on Apple Silicon Macs running iOS simulator.
- **Missing workspace deps.** If `ports/<name>/wasm` doesn't list `@crossbind/port-zlib-wasm` in `dependencies`, pnpm may build them in the wrong order; the linker then fails to find symbols.
- **Mixing scoped and unscoped names.** Stick to one: `@crossbind/*` for in-repo, plain `crossbind-port-*` for community/user-org. Don't mix.
- **Not pinning `nativeVersion`.** Without a pin, `check:native --update` later overwrites silently and reproducible builds break.
- **`bin/` artifacts in `.npmignore`** — make sure `dist/prebuilt/<target>/lib/lib<name>.a` (and `.so` for android, `.xcframework` for ios) is **not** ignored, or consumers can't link.
- **Wrong upstream license.** The crossbind wrapper README is permissive but the native binary's license governs distribution. If the upstream is GPL-only, surface this prominently in README and ask the user to confirm intent.
- **Naming collisions in user orgs.** A user can't publish `@crossbind/port-foo`. They need `crossbind-port-foo` (unscoped, on npm). crossbind's plugin discovery finds packages matching `*port-*` regardless of scope.
- **Recommend over enforce.** The user always picks where to host (their org / crossbind-community / direct PR here). Surface the decision tree, don't force.

## Reference

- Canonical small example: `ports/zlib/`
- CMake-heavy example: `ports/tiff/` (transitive deps: zlib, jpegturbo, zstd, lerc)
- autotools example: `ports/openssl/`
- Big aggregator example: `ports/gdal/` (depends on ~13 other packages)
- Native version checker: `scripts/check-native-versions.js`
- Distribution CMake template: `core/crossbind/src/assets/cmake/dist.cmake`
