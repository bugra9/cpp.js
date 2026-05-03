# AGENTS.md — @cpp.js/plugin-rollup

> Standalone Rollup plugin **and** the inner kernel of `@cpp.js/plugin-vite`. Bundler-agnostic logic lives here; bundler-specific glue (Vite dev server, etc.) lives one level up.

## What lives here

- `index.js` — single file, exports `rollupCppjsPlugin(options, bridges)` factory. The `bridges` array is shared by the Vite outer plugin so both can append to one accumulating list per project.

## Hooks the plugin implements

| Rollup hook | What it does |
|-------------|--------------|
| `resolveId('cpp.js')` | Mark the cpp.js loader as `external: true` so consumers fetch it at runtime, not bundle it |
| `transform(code, '.h')` | Run SWIG bridge generation; emit JS bridge code for the header |
| `buildStart` | Iterate `state.config.paths.native` array; `addWatchFile` every entry. Watch mode now sees `.cpp`/`.h` edits |
| `generateBundle` | Run `createLib + createXCFramework + buildWasm` with `force = isSourceNewer(...)`; emit `cpp.js`, `cpp.wasm`, `cpp.data.txt` as bundle assets |

## Invariants

- **`paths.native` is an array.** The outer Vite plugin assumed this years ago; this plugin must too. `existsSync(array)` returns false silently — always iterate entries before testing each one.
- **`force = isSourceNewer(buildTargetRelease)`** in `generateBundle`. Skips rebuild when artifacts are newer than every native source; bypasses cache when not.
- **`bridges` accumulates across `transform` calls.** Don't reset; downstream `generateBundle` reads the union.

## Common pitfalls

- **Forgetting to call `addWatchFile` per native dir.** Watch mode silently skips edits → users think `pnpm rollup -w` is broken.
- **Returning `external: true` for `cpp.js` in some configs and `false` in others.** Inconsistency makes Vite's HMR vs prod build behave differently.
- **Emitting `cpp.js`/`cpp.wasm` to a custom path.** Consumers (including Vite) expect `cpp.js`, `cpp.wasm`, `cpp.data.txt` at the bundle root. Don't rename without updating the loader.
- **Re-running `buildWasm` without `force` semantics.** Cache-shortcut bugs land here; always go through `isSourceNewer`.
- **Calling `state.config.paths.cli/...` directly with hardcoded sub-paths.** Use the public `cpp.js` exports (`createLib`, `buildWasm`, `getCppJsScript`, …); they survive asset reorgs.

## Validation

Touching this plugin propagates to:

- `cppjs-plugin-vite` (wraps it) — all Vite samples must keep working.
- Anyone using rollup standalone (rare).

Strict gate:

```bash
pnpm run ci:linux:build && pnpm run e2e:dev && pnpm run e2e:prod
```

Targeted Vite smoke (since this plugin's biggest consumer is `plugin-vite`):

```bash
pnpm --filter=@cpp.js/sample-web-vue-vite run build
pnpm --filter=@cpp.js/playground-web-vite-multithread run build
```

## Reference

- Outer Vite wrapper: `cppjs-plugins/cppjs-plugin-vite/`
- Standalone integration recipe: `docs/playbooks/integration/rollup.md`
- Vite integration recipe: `docs/playbooks/integration/vite.md`
- Force-rebuild trigger: `cppjs-core/cpp.js/src/actions/isSourceNewer.js`
