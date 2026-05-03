---
description: Fix a bug in the cpp.js monorepo (core orchestrator, bundler plugin, package, or sample) and validate it against the right surface — without committing or pushing.
---

The user reported a bug in cpp.js. Reproduce it, fix it, and validate it against the right validation matrix slice.

## Steps

1. **Locate the layer.** One of:
   - **Core orchestrator** → `cppjs-core/cpp.js/src/` (CLI, build pipeline, state, plugin host).
   - **Bundler plugin** → `cppjs-plugins/cppjs-plugin-{vite,webpack,rollup,react-native}/`.
   - **Prebuilt package** → `cppjs-packages/cppjs-package-<name>/cppjs-package-<name>-{wasm,android,ios}/`.
   - **Sample / playground** → `cppjs-samples/cppjs-{sample,playground}-*/`.

   `docs/CODEMAP.md` maps concept → file pointer if the user only described symptoms.

2. **Reproduce against the smallest viable sample.**
   - Web bundler bug → `cppjs-samples/cppjs-sample-web-vue-vite/` or `cppjs-playground-web-vite-multithread/`.
   - React Native bug → `cppjs-samples/cppjs-sample-mobile-reactnative-cli/`.
   - Node bug → run the CLI directly against a package.
   - Cross-arch package bug → `cppjs-playground-lib-prebuilt-matrix/`.

   Don't guess — actually run the failing scenario and capture the error.

3. **Fix the root cause, not the symptom.** Common patterns to watch for:
   - `paths.native` is an **array** in some configs — iterate, don't `fs.existsSync(arr)`.
   - `force: true` may be needed on `createLib` / `buildWasm` to bypass the "already built" cache during HMR.
   - rimraf v6 needs `-g` for glob patterns.
   - mtime-based `isSourceNewer` decides cache invalidation — Windows-safe but watch for dir-vs-file checks.
   - Multithread (`mt`) WASM in production silently fails without `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` headers.

4. **Validate against the right matrix slice.** Don't run everything — match the change:

   | Changed | Validate with |
   |---------|---------------|
   | Core orchestrator | `pnpm --filter @cpp.js/cpp.js test` (when present), then build at least one wasm + one ios + one android package |
   | One bundler plugin | Build + dev + prod the matching sample (e.g. vite plugin → vue-vite sample) |
   | One package | `pnpm --filter='@cpp.js/package-<name>*' run build` for all 3 arches |
   | A sample | `pnpm install && pnpm dev && pnpm build` inside that sample |

   For multithread fixes: also verify `crossOriginIsolated === true` in the browser console.

5. **If a similar bug could exist in sibling code, check it.** Bundler plugins (vite/webpack/rollup) often share the same shape — when fixing one, grep the others for the same antipattern.

6. **Hand the diff back to the user.** Show the before/after, summarize what was changed, and report what you validated. **Do not commit, push, or open a PR** — the user will review and ship.

## Don't

- Skip reproduction. "I think this fixes it" without running the failing case is not a fix.
- Run the entire validation matrix when a single sample tests the changed surface — wastes 5+ minutes per build target.
- Forget to grep sibling plugins / packages for the same antipattern.
- Commit, push, tag, or open a PR. The user does that.
- Bypass safety checks (`--no-verify`, `--no-gpg-sign`, etc.) to make the build "work."

## Reference

Bug-fix playbook: https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/bug-fix.md
Validation matrix: see the table in `AGENTS.md` at the repo root.
Concept → file map: `docs/CODEMAP.md`.
