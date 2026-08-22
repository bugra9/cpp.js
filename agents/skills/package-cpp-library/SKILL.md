---
name: package-cpp-library
description: Use this skill when the user wants to wrap a C++ library as a reusable crossbind package — phrases like "package libsodium for crossbind", "create a new crossbind port", "publish my C++ library so others can pnpm add it", "add FreeType / libsndfile / fftw / OpenCV to the crossbind ecosystem", "make my CMake project consumable from JS via crossbind", "publish a Rust crate as a crossbind package". Pairs with the scaffold-package script and the new-package playbook. Rust crates use the same flow with `export.type: 'cargo'`.
---

# package-cpp-library

Walk the user through wrapping a C++ library as a `ports/*` family that other projects can `pnpm add`.

## Step 0 — Decide where the package lives

```
Does this package extend or affect GDAL (or another package already in
the crossbind monorepo's transitive dep graph)?
│
├─ YES → Add directly to the crossbind repo (ports/<name>/).
│         Use the @crossbind/* npm scope.
│         This requires a PR to https://github.com/crossbind/crossbind
│
└─ NO  → Author it outside this repo:
          1. Strongly encourage the crossbind-community GitHub org. Help the
             user file a "transfer to crossbind-community when ready" plan.
          2. They can also keep it in their own org. In that case:
             - npm name MUST be unscoped: `ports/<name>`
             - NOT `@user/ports/<name>`, NOT `@crossbind/...`
          The unscoped naming pattern lets crossbind's plugin discovery find
          packages by name regardless of org.
```

## Step 1 — Scaffold the skeleton

The crossbind repo ships a scaffold script:

```bash
node scripts/scaffold-package.js <name> [--scope ""] [--license MIT] [--lib <name>]
```

The script copies `ports/zlib/` (smallest reference) and rewrites:

- All `ports/zlib` → `ports/<name>` (filenames + content).
- `package.json`: `name`, `version: 0.1.0`, `nativeVersion: ""`, `license`, `keywords`, drop zlib workspace deps.
- iOS podspec lib references (`libz.a` → `lib<name>.a`, `z.xcframework` → `<name>.xcframework`).

For community / user-org packages: `--scope ""` (unscoped npm name).

Skips build artifacts (`dist/`, `.crossbind/`, `node_modules/`, `*.xcframework`) so the user gets a clean starting tree.

## Step 2 — Fetch + build the upstream library

Edit each sub-arch's `crossbind.build.js`:

- `getSource()`: download / clone / copy the upstream source. Use `state.config.paths.build` for staging.
- `prepare()`: cmake configure step (or `./configure` for autotools).
- `build()`: cmake build / make install.

Build system priority:
1. **CMake** if upstream has a `CMakeLists.txt`. Easiest cross-platform.
2. **autotools** (`./configure && make`) for libraries without CMake. Set `state.config.build.buildType = 'configure'`. See `ports/openssl-*` for reference.
3. **Custom Make / scons** as last resort.

## Step 3 — Set the upstream version

Always use the **latest stable** upstream version. Resolution order:

1. GitHub releases API (filter prereleases unless library only ships them).
2. GitHub tags API.
3. Project HTML download index (autotools projects often ship tarballs without GitHub releases).

The repo's helper does all three:

```bash
pnpm run check:native -- --update
```

This auto-bumps `nativeVersion` in every affected `package.json` (or writes it for the first time on a fresh package).

## Step 4 — Wire transitive C++ deps

If the library links against zlib, openssl, etc., add them to each sub-arch's `package.json` `dependencies`:

```jsonc
"dependencies": {
    "@crossbind/port-zlib-wasm": "workspace:^",
    "@crossbind/port-openssl-wasm": "workspace:^"
}
```

Same for `-android`, `-ios`. pnpm derives topological build order from this; without it, the linker fails with "undefined symbol".

## Step 5 — Build all arches

```bash
pnpm install
pnpm --filter='@crossbind/port-<name>*' run build
```

Wasm + Android build on Linux/macOS. iOS only on macOS.

## Step 6 — Required files (Definition of Done)

Per sub-arch: `package.json`, `crossbind.config.js`, `crossbind.build.js`, `README.md`, `LICENSE` (upstream's), `.npmignore`. iOS adds `crossbind-port-<name>.podspec` with `EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64`.

The scaffold script gets all of these from the zlib template, but the user must:

- Update README intent paragraph.
- Replace `LICENSE` content with upstream's actual license.
- Verify `.npmignore` excludes `.crossbind/`, source tarballs, intermediates — but **keeps** `dist/prebuilt/` (consumers need it).

## Step 7 — When integrating into the crossbind repo

Only do this if the package fits "GDAL-affecting" criteria:

- Add an e2e test exercise to a sample (mirror `e2e/*`).
- Validation gate: `pnpm run e2e:dev && pnpm run e2e:prod` must pass.
- Open a PR with the new `ports/<name>/` family.

For community / user-org packages, **skip e2e**. Standalone build success is enough; the user's own consumer project tests it.

## Don't

- Default to the `@crossbind/*` scope without checking the GDAL-affect routing.
- Skip `nativeVersion` pinning.
- Forget `EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64` on the iOS podspec.
- Ignore upstream license. The wrapper README can be MIT but the bundled binary's license governs distribution. GPL-only upstream → flag prominently.
- Author the package in this repo when it has nothing to do with GDAL — community / user-org is the default.

## Reference

Full playbook: https://github.com/crossbind/crossbind/blob/main/docs/playbooks/new-package.md
Scaffold script: https://github.com/crossbind/crossbind/blob/main/scripts/scaffold-package.js
Canonical small example: `ports/zlib/`
Big aggregator example: `ports/gdal/`
autotools example: `ports/openssl/`
