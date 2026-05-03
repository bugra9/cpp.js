# Playbook — Fix a bug in cpp.js

> **Persona 1** — Contributor. The user is editing this repo to fix a defect in the CLI, a plugin, a package, or a sample.

## Goal

Land a minimal, well-validated fix that:

- Reproduces in the smallest possible scope first.
- Passes the right validation gate for the area touched.
- Does not silently widen blast radius (no opportunistic refactors riding along).

## When to use

- A CI workflow is failing.
- A user reports a runtime error from `cppjs build` or a sample.
- A plugin / runtime adapter behaves incorrectly in a specific framework.
- An e2e test is flaky or wrong.

## Files involved

Depends on the bug. Use `docs/CODEMAP.md` to find the right file:

| Symptom | Likely area |
|---------|-------------|
| `cppjs build` errors out | `cppjs-core/cpp.js/src/{actions,state,utils}/` |
| Wrong artifact path / cache miss | `actions/createLib.js`, `actions/buildWasm.js`, `actions/isSourceNewer.js` |
| iOS-only / xcframework issue | `actions/createXCFramework.js`, package podspec |
| Bundler dev server / HMR misbehaving | `cppjs-plugins/cppjs-plugin-{vite,webpack,rollup}/index.js` |
| RN build crash | `cppjs-plugins/cppjs-plugin-react-native/script/build_{android,ios,js}.js`, `script/CMakeLists.txt` |
| Linker error in package | the package's `cppjs.config.js` / `package.json` workspace deps |
| Browser runtime error after `init` | `cppjs-core/cpp.js/src/assets/js-runtime/` |

## Reproduction strategy

1. **Reproduce in the smallest sample first.** Don't debug against `cppjs-sample-mobile-reactnative-cli` if `cppjs-sample-backend-nodejs-wasm` reproduces the same bug — the smaller the surface, the faster the loop.
2. **Use `pnpm --filter` for incremental builds.** Avoid `pnpm run clear` unless you've already tried `pnpm --filter=<scope> run build` and rebuild semantics are demonstrably wrong (mtime check missed something).
3. **Read logs from `cppjs-core/cpp.js/src/utils/logger.js` output.** Step lines update in place; non-TTY (CI) shows a chronological log. Errors print to stderr in red.

## Validation matrix

Pick the gate that matches the **scope of the change**, not the bug:

```
Did you change anything inside cppjs-core/cpp.js/ ?
│
├─ YES → Run: pnpm run ci:linux:build && pnpm run e2e:dev && pnpm run e2e:prod
│         All three must pass.
│
└─ NO ↓

Did you change anything inside cppjs-plugins/ ?
│
├─ YES → Same gate as above:
│         pnpm run ci:linux:build && pnpm run e2e:dev && pnpm run e2e:prod
│
└─ NO ↓

Did you change a single cppjs-package-X family?
│
├─ YES → pnpm --filter='@cpp.js/package-<name>*' run build
│         Plus: pnpm run check:dist (confirm artifacts exist).
│         Plus: any sample that consumes the package still e2e-passes
│         (find via `pnpm why -r @cpp.js/package-<name>`).
│
└─ NO ↓

Sample-only change?
│
├─ YES → pnpm --filter=@cpp.js/sample-<name> run build
│         Plus the sample's own e2e (e2e:dev / e2e:prod / e2e:ios / e2e:android).
│
└─ NO → Docs / scripts / CI only:
         pnpm run check
         Plus targeted manual smoke (e.g. run the script you changed).
```

`ci:linux:build` runs `pnpm run build:samples && pnpm run ci:linux:build:package` — it builds every sample plus zlib as a smoke. `e2e:dev` runs Playwright in dev mode against samples; `e2e:prod` against built artifacts.

## Commands

```bash
# Discover what's changed and where:
git status --short
git diff --stat

# Health snapshot (~5s):
pnpm run check

# Reproduce locally (smallest sample):
pnpm --filter=@cpp.js/sample-backend-nodejs-wasm run build
pnpm --filter=@cpp.js/sample-backend-nodejs-wasm exec node dist/main.js

# Iterate fast (one package or sample):
pnpm --filter=<scope> run build

# Full validation (core / plugin changes):
pnpm run ci:linux:build && pnpm run e2e:dev && pnpm run e2e:prod
```

## Validation

- [ ] Bug reproduces deterministically before the fix.
- [ ] Fix is minimal (no opportunistic refactors). If you found other issues, file separate issues / PRs.
- [ ] The matching validation gate from the matrix above passes.
- [ ] `pnpm run check` shows no new outdated entries you didn't intend.
- [ ] If you touched a public API in `cpp.js` exports, search consumers (`grep -rn 'from .cpp\.js.' cppjs-plugins cppjs-samples`) and confirm none break.
- [ ] If the bug had a CI signal (workflow failure), the same workflow now passes locally via the same command sequence.

## Common pitfalls

- **Cache-shaped bugs misdiagnosed as code bugs.** If a change "doesn't take effect", check whether `actions/isSourceNewer.js` correctly detects the touched file's mtime. Rebuild with `force: true` or filter-rebuild before assuming the code is wrong.
- **Confusing CI pass with local pass.** CI runs Linux, no Xcode; iOS-affecting fixes need a darwin host to actually validate.
- **Changing `state/loadConfig.js` defaults.** This affects every package and sample. Run the full validation matrix even if the change "looks small".
- **Forgetting transitive plugin impact.** A change in `cppjs-plugin-rollup` affects `cppjs-plugin-vite` (which wraps it). Validate both bundler samples.
- **Editing `.cppjs/` or `dist/` by hand.** They're generated. Find the source.
- **Grafting the fix onto sample's own config.** If the bug is in a plugin, fix the plugin — don't paper over with a sample config tweak.

## Reference

- Validation matrix is also summarized in `AGENTS.md` (root, "Commands → Validation matrix").
- Logger semantics: `cppjs-core/cpp.js/src/utils/logger.js`.
- Force-rebuild semantics: `cppjs-core/cpp.js/src/actions/isSourceNewer.js`.
- CI workflow definitions: `.github/workflows/build-{linux,macos,windows}.yml`.
