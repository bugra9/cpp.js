# Integration — Webpack / Rspack

> Persona 2 sub-playbook. The user's project uses Webpack or Rspack (`webpack` / `@rspack/core` in deps; `webpack.config.*` or `rspack.config.*` at root).

> The same `@cpp.js/plugin-webpack` package supports **both** Webpack and Rspack — Rspack reuses the Webpack plugin API surface.

## Goal

Wire `@cpp.js/plugin-webpack` into the bundler config so dev-server serves wasm with COOP/COEP, the loader handles `.h` files, and prod build emits `cpp.js` + `cpp.wasm` artifacts.

## When to use

- `webpack`, `webpack-cli` in deps, OR
- `@rspack/core`, `@rspack/cli` in deps.
- Config file at root: `webpack.config.{js,mjs,cjs,ts}` or `rspack.config.{js,mjs,ts}`.

## Files involved

| File | Role |
|------|------|
| `package.json` | + `cpp.js`, `@cpp.js/plugin-webpack`, `@cpp.js/plugin-webpack-loader`, optional `@cpp.js/package-<name>` |
| `webpack.config.*` / `rspack.config.*` | Construct plugin, register loader rule, plug `devServer` config |
| `cppjs.config.js` *(new at root)* | Project-level cpp.js config |
| `src/native/` *(only if user wraps own C++)* | `.h` + `.cpp` source files |
| Production headers config | Hosting layer (only for multithread) |

## Commands

```bash
pnpm add cpp.js @cpp.js/plugin-webpack @cpp.js/plugin-webpack-loader
pnpm add @cpp.js/package-<name>     # optional, for prebuilt libraries

# Dev (Rspack)
pnpm dev    # or `pnpm rspack serve`
# Dev (Webpack)
pnpm dev    # or `pnpm webpack serve`

# Production
pnpm build
```

## Reference config

Mirror `cppjs-samples/cppjs-sample-web-react-rspack/rspack.config.mjs` (canonical for Rspack; Webpack identical except imports):

```js
import { defineConfig } from '@rspack/cli';
import CppjsWebpackPlugin from '@cpp.js/plugin-webpack';

const cppjsWebpackPlugin = new CppjsWebpackPlugin();

export default defineConfig({
    entry: { main: './src/main.jsx' },
    module: {
        rules: [
            cppjsWebpackPlugin.getRule(),    // .h loader, hands work to plugin-webpack-loader
            // ... other rules
        ],
    },
    plugins: [
        cppjsWebpackPlugin,                  // register the plugin
    ],
    devServer: cppjsWebpackPlugin.getDevServerConfig(),  // COOP/COEP + middleware
});
```

What the plugin gives you:

- `getRule()` — webpack module rule for `.h` files (delegates to `@cpp.js/plugin-webpack-loader`).
- `getDevServerConfig()` — devServer config with `headers` (COOP/COEP) and middleware that serves `/cpp.js`, `/cpp.wasm`, `/cpp.data.txt` from the build output.
- `getLoaderOptions()` — escape hatch when you need cpp.js state inside the config (target filtering, etc.).

For Webpack (CommonJS-style):

```js
const CppjsWebpackPlugin = require('@cpp.js/plugin-webpack').default;
const cppjsWebpackPlugin = new CppjsWebpackPlugin();

module.exports = {
    // …same shape as the Rspack example
};
```

## Customizing devServer

If the project already has a `devServer` block, **merge** with `getDevServerConfig()`:

```js
const cppDev = cppjsWebpackPlugin.getDevServerConfig();
export default defineConfig({
    // …
    devServer: {
        ...cppDev,
        port: 4000,
        proxy: [...],
        headers: { ...cppDev.headers, 'X-Custom': 'value' },
    },
});
```

Key headers are `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. Don't drop them.

## Multithread → production headers

Same as the Vite playbook — devServer is handled by the plugin, production deploy is the user's hosting layer's responsibility. See `docs/playbooks/integration/vite.md` "Multithread → production headers" table for per-host recipes.

## Validation

- [ ] `pnpm install` succeeds.
- [ ] Dev server starts, page loads with no 404 on `/cpp.js`, `/cpp.wasm`.
- [ ] Browser console: `crossOriginIsolated` returns `true` (only required if multithread).
- [ ] Saving a `.cpp`/`.h` file under `src/native/` triggers a rebuild + page refresh.
- [ ] `pnpm build` produces `dist/` with `cpp.js`, `cpp.wasm` (and `cpp.data.txt` if data preloaded).
- [ ] User-side: `await initCppJs(); Module.someFn(...)` returns expected result.

## Common pitfalls

- **Missing `@cpp.js/plugin-webpack-loader`.** The plugin's `getRule()` references a loader by package name; if it's not installed, webpack throws "Module not found".
- **Forgetting `cppjsWebpackPlugin.getRule()`.** Plugin alone isn't enough — `.h` files need the loader rule too. Register both.
- **Dropping plugin's `headers`** when merging custom devServer config. Use spread: `{ ...cppDev.headers, ...custom }`.
- **Babel/SWC ahead of cppjs loader.** The loader chain matters. `getRule()` returns a `test: /\.h$/` rule; place it among other rules (order doesn't matter — webpack picks per-test). Don't wrap `.h` in a babel/swc rule.
- **Trying to use `getRule()` outside `module.rules`** (e.g. inside `plugins`). It's a rule, not a plugin instance. Plugin instance also goes in `plugins:` array.
- **TurboPack / Next 13+ App Router.** This playbook is for plain Webpack/Rspack. For Next, see `docs/playbooks/integration/nextjs.md`.

## Reference samples

- `cppjs-samples/cppjs-sample-web-react-rspack/` — React + Rspack, canonical
- `cppjs-samples/cppjs-playground-web-rspack/` — React + Rspack + GDAL/CURL playground

Plugin source: `cppjs-plugins/cppjs-plugin-webpack/index.js`.
Loader source: `cppjs-plugins/cppjs-plugin-webpack-loader/`.
