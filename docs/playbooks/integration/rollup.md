# Integration — Rollup (standalone)

> Persona 2 sub-playbook. The user's project uses Rollup directly (not via Vite). Detection: `rollup` in deps, `rollup.config.{js,mjs,ts}` at root, no `vite`/`webpack`/`@rspack/*`.

> **Most users want the Vite playbook**, not this one. Vite wraps Rollup, and `@cpp.js/plugin-rollup` is the inner kernel of `@cpp.js/plugin-vite`. Use this playbook only when the project authors a JS library/CLI directly with Rollup (not building an app).

## Goal

Add `@cpp.js/plugin-rollup` to a Rollup config so:

- Rollup's `transform` hook handles `.h` files (generates the JS bridge).
- `generateBundle` runs `cppjs build` and emits `cpp.js` + `cpp.wasm` as Rollup assets.
- Rollup watch mode rebuilds wasm when native sources change.

## When to use

- Standalone Rollup (no Vite / Webpack / Rspack).
- Library output (`format: 'esm' | 'cjs' | 'umd'`), not an app bundle.
- Rare in app development; common for SDK / CLI authors.

## Files involved

| File | Role |
|------|------|
| `package.json` | + `cpp.js`, `@cpp.js/plugin-rollup`, optional `@cpp.js/package-<name>` |
| `rollup.config.{js,mjs,ts}` | Add `rollupCppjsPlugin()` to `plugins` |
| `cppjs.config.js` *(new at root)* | Project-level cpp.js config |
| `src/native/` *(only if user wraps own C++)* | `.h` + `.cpp` source |

## Commands

```bash
pnpm add cpp.js @cpp.js/plugin-rollup
pnpm add @cpp.js/package-<name>     # optional

# Build
pnpm rollup -c

# Watch
pnpm rollup -c -w
```

## Reference config

```js
import rollupCppjsPlugin from '@cpp.js/plugin-rollup';

export default {
    input: 'src/index.js',
    output: { file: 'dist/index.js', format: 'esm' },
    plugins: [
        rollupCppjsPlugin(),
    ],
};
```

What the plugin gives you:

- `resolveId('cpp.js')` — externalizes / resolves the cpp.js loader to the freshly built file.
- `transform('.h')` — converts header files into JS bridge code (Embind/SWIG output).
- `buildStart` — adds `state.config.paths.native/**` to Rollup's watch list (via `addWatchFile`).
- `generateBundle` — runs `cppjs build` (mtime-aware: skips when artifacts are newer than sources) and emits `cpp.js`, `cpp.wasm`, `cpp.data.txt` as bundle assets.

## No dev server (Rollup only)

Standalone Rollup doesn't have a dev server. If the user needs hot reload, they almost certainly want **Vite** instead. Suggest switching to Vite (which uses Rollup under the hood) for app-style projects:

> If you're building an app (not a library), Vite gives you Rollup + a dev server + COOP/COEP automation — see `docs/playbooks/integration/vite.md`.

## Multithread → COOP/COEP

If the user picks `runtime: 'mt'` in `cppjs.config.js`, the resulting library still needs COOP/COEP headers wherever it runs. Since Rollup just outputs the bundle, **the consuming app** must serve those headers — same matrix as the Vite playbook.

## Validation

- [ ] `pnpm install` succeeds.
- [ ] `pnpm rollup -c` runs without errors.
- [ ] `dist/` contains the user's bundle plus `cpp.js`, `cpp.wasm`.
- [ ] Watch mode picks up native source changes (`pnpm rollup -c -w`, edit a `.cpp`, see rebuild log).
- [ ] Library consumer can `import { initCppJs } from '<the lib>'; await initCppJs(); Module.fn(...)`.

## Common pitfalls

- **Using rollup standalone when you want an app.** Switch to Vite. Faster, has dev-server, COOP/COEP automation.
- **Missing `paths.native` in `cppjs.config.js`.** Watch list is empty → `.cpp` edits don't trigger rebuild. Default `src/native/` works; override only if you've moved sources.
- **Output format `iife` or `umd` for a library used by Node.** Choose `esm`/`cjs` — the cpp.js loader expects standard module semantics.
- **Bundling `cpp.js` itself into the library output.** The plugin externalizes `/cpp.js` so the consumer fetches the actual built script. Don't mark cpp.js as bundled.
- **Trying to add a dev-server middleware.** Rollup doesn't have one. Use Vite.

## Reference

- Plugin source: `cppjs-plugins/cppjs-plugin-rollup/index.js`
- Used as kernel of: `cppjs-plugins/cppjs-plugin-vite/index.js`
- No standalone Rollup sample in this repo — `cppjs-plugin-rollup` is exercised through `plugin-vite` and the various Vite samples.
