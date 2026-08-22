---
description: Wrap a C++ library or Rust crate as a reusable ports/* family (web/Wasm + iOS + Android + WASI) that other projects can pnpm add.
---

The user wants to package a C++ library so others can install and use it via crossbind. Walk them through it.

## Steps

1. **Decide where the package lives.** Ask one question:
   > Does this package extend or affect GDAL (or another package already inside the crossbind monorepo's transitive dep graph)?

   - **Yes** → goes in this repo: `ports/<name>/`. npm scope: `@crossbind/*`. Requires a PR to https://github.com/crossbind/crossbind.
   - **No** → author it outside this repo. Strongly recommend the **crossbind-community** GitHub org (or the user's own org as a fallback). npm name MUST be unscoped: `ports/<name>` — NOT `@user/ports/<name>`. The unscoped pattern lets crossbind's plugin discovery find packages regardless of org.

2. **Scaffold the skeleton:**
   ```bash
   node scripts/scaffold-package.js <name> [--scope ""] [--license MIT] [--lib <name>]
   ```
   For community / user-org packages: pass `--scope ""` to drop the `@crossbind/` prefix. The script copies `ports/zlib/` (smallest reference) and rewrites filenames + content + iOS podspec lib names.

3. **Edit each sub-arch's `crossbind.build.js`** (`-wasm`, `-android`, `-ios`):
   - `getSource()`: download / clone / copy upstream source into `state.config.paths.build`.
   - `prepare()`: cmake configure (or `./configure` for autotools — set `state.config.build.buildType = 'configure'`).
   - `build()`: cmake build / make install.

   Build system priority: CMake > autotools > custom Make.

4. **Pin the upstream version.** Use the **latest stable** release. Run:
   ```bash
   pnpm run check:native -- --update
   ```
   This auto-bumps `nativeVersion` in every affected `package.json` from GitHub releases / tags / project HTML download index.

5. **Wire transitive C++ deps.** If the library links against zlib, openssl, etc., add them to each sub-arch's `package.json` `dependencies` (e.g. `"@crossbind/port-zlib-wasm": "workspace:^"`). pnpm derives topological build order from this; without it, the linker fails with "undefined symbol".

6. **Build all arches:**
   ```bash
   pnpm install
   pnpm --filter='@crossbind/port-<name>*' run build
   ```
   Wasm + Android build on Linux/macOS. iOS only on macOS.

7. **Definition of Done — required files per sub-arch:**
   - `package.json`, `crossbind.config.js`, `crossbind.build.js`, `README.md`, `LICENSE` (upstream's), `.npmignore`.
   - iOS adds `crossbind-port-<name>.podspec` with `EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64`.
   - `.npmignore` excludes `.crossbind/`, source tarballs, intermediates — but **keeps** `dist/prebuilt/` (consumers need it).

8. **In-repo only:** add an e2e exercise to a sample (mirror `e2e/*`) and ensure `pnpm run e2e:dev && pnpm run e2e:prod` pass before opening a PR.

   Community / user-org packages: skip e2e. Standalone build success is enough.

## Don't

- Default to the `@crossbind/*` scope without checking the GDAL-affect routing.
- Skip `nativeVersion` pinning — float-version builds drift.
- Forget `EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64` on the iOS podspec.
- Ignore upstream license. The wrapper README can be MIT but the bundled binary's license governs distribution. GPL-only upstream → flag prominently.
- Author the package in this repo when it has nothing to do with GDAL — community / user-org is the default.

## Reference

Full playbook: https://github.com/crossbind/crossbind/blob/main/docs/playbooks/new-package.md
Scaffold script: https://github.com/crossbind/crossbind/blob/main/scripts/scaffold-package.js
Canonical small example: `ports/zlib/`
autotools example: `ports/openssl/`
