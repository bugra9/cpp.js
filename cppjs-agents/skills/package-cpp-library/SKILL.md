---
name: package-cpp-library
description: Use this skill when the user wants to wrap a C++ library as a reusable cpp.js package — phrases like "package libsodium for cpp.js", "create a new cppjs-package-X", "publish my C++ library so others can pnpm add it", "add FreeType / libsndfile / fftw / OpenCV to the cpp.js ecosystem", "make my CMake project consumable from JS via cpp.js". Pairs with the scaffold-package script and the new-package playbook.
---

# package-cpp-library

Walk the user through wrapping a C++ library as a `cppjs-package-*` family that other projects can `pnpm add`.

## Step 0 — Decide where the package lives

```
Does this package extend or affect GDAL (or another package already in
the cpp.js monorepo's transitive dep graph)?
│
├─ YES → Add directly to the cpp.js repo (cppjs-packages/cppjs-package-<name>/).
│         Use the @cpp.js/* npm scope.
│         This requires a PR to https://github.com/bugra9/cpp.js
│
└─ NO  → Author it outside this repo:
          1. Strongly encourage the cppjs-community GitHub org. Help the
             user file a "transfer to cppjs-community when ready" plan.
          2. They can also keep it in their own org. In that case:
             - npm name MUST be unscoped: `cppjs-package-<name>`
             - NOT `@user/cppjs-package-<name>`, NOT `@cpp.js/...`
          The unscoped naming pattern lets cpp.js's plugin discovery find
          packages by name regardless of org.
```

## Step 1 — Scaffold the skeleton

The cpp.js repo ships a scaffold script:

```bash
node scripts/scaffold-package.js <name> [--scope ""] [--license MIT] [--lib <name>]
```

The script copies `cppjs-packages/cppjs-package-zlib/` (smallest reference) and rewrites:

- All `cppjs-package-zlib` → `cppjs-package-<name>` (filenames + content).
- `package.json`: `name`, `version: 0.1.0`, `nativeVersion: ""`, `license`, `keywords`, drop zlib workspace deps.
- iOS podspec lib references (`libz.a` → `lib<name>.a`, `z.xcframework` → `<name>.xcframework`).

For community / user-org packages: `--scope ""` (unscoped npm name).

Skips build artifacts (`dist/`, `.cppjs/`, `node_modules/`, `*.xcframework`) so the user gets a clean starting tree.

## Step 2 — Fetch + build the upstream library

Edit each sub-arch's `cppjs.build.js`:

- `getSource()`: download / clone / copy the upstream source. Use `state.config.paths.build` for staging.
- `prepare()`: cmake configure step (or `./configure` for autotools).
- `build()`: cmake build / make install.

Build system priority:
1. **CMake** if upstream has a `CMakeLists.txt`. Easiest cross-platform.
2. **autotools** (`./configure && make`) for libraries without CMake. Set `state.config.build.buildType = 'configure'`. See `cppjs-package-openssl-*` for reference.
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
    "@cpp.js/package-zlib-wasm": "workspace:^",
    "@cpp.js/package-openssl-wasm": "workspace:^"
}
```

Same for `-android`, `-ios`. pnpm derives topological build order from this; without it, the linker fails with "undefined symbol".

## Step 5 — Build all arches

```bash
pnpm install
pnpm --filter='@cpp.js/package-<name>*' run build
```

Wasm + Android build on Linux/macOS. iOS only on macOS.

## Step 6 — Required files (Definition of Done)

Per sub-arch: `package.json`, `cppjs.config.js`, `cppjs.build.js`, `README.md`, `LICENSE` (upstream's), `.npmignore`. iOS adds `cppjs-package-<name>.podspec` with `EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64`.

The scaffold script gets all of these from the zlib template, but the user must:

- Update README intent paragraph.
- Replace `LICENSE` content with upstream's actual license.
- Verify `.npmignore` excludes `.cppjs/`, source tarballs, intermediates — but **keeps** `dist/prebuilt/` (consumers need it).

## Step 7 — When integrating into the cpp.js repo

Only do this if the package fits "GDAL-affecting" criteria:

- Add an e2e test exercise to a sample (mirror `cppjs-samples/cppjs-playground-*`).
- Validation gate: `pnpm run e2e:dev && pnpm run e2e:prod` must pass.
- Open a PR with the new `cppjs-package-<name>/` family.

For community / user-org packages, **skip e2e**. Standalone build success is enough; the user's own consumer project tests it.

## Don't

- Default to the `@cpp.js/*` scope without checking the GDAL-affect routing.
- Skip `nativeVersion` pinning.
- Forget `EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64` on the iOS podspec.
- Ignore upstream license. The wrapper README can be MIT but the bundled binary's license governs distribution. GPL-only upstream → flag prominently.
- Author the package in this repo when it has nothing to do with GDAL — community / user-org is the default.

## Reference

Full playbook: https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/new-package.md
Scaffold script: https://github.com/bugra9/cpp.js/blob/main/scripts/scaffold-package.js
Canonical small example: `cppjs-packages/cppjs-package-zlib/`
Big aggregator example: `cppjs-packages/cppjs-package-gdal/`
autotools example: `cppjs-packages/cppjs-package-openssl/`
