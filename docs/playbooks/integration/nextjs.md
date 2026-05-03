# Integration — Next.js

> Persona 2 sub-playbook. The user's project is a Next.js app. Detection: `next` in deps, `next.config.{js,mjs,ts}` at root.

> No canonical sample exists in this repo yet. This playbook synthesizes the Webpack and Vite playbooks; verify edge cases against `cppjs-sample-web-react-rspack/` (closest cousin).

## Goal

Add cpp.js to a Next.js app so:

- Client-side bundle loads `cpp.js` + `cpp.wasm`.
- Dev server (`next dev`) and production server (`next start`) serve COOP/COEP headers when multithread is in use.
- App Router and Pages Router both work.
- The wasm is fetched at the right URL (Next's static asset path).

## When to use

- `next` in deps (any version 13+).
- `next.config.{js,mjs,cjs,ts}` at root.
- Either App Router (`app/` directory) or Pages Router (`pages/` directory).

## Files involved

| File | Role |
|------|------|
| `package.json` | + `cpp.js`, `@cpp.js/plugin-webpack`, `@cpp.js/plugin-webpack-loader`, optional `@cpp.js/package-<name>` |
| `next.config.{js,mjs,ts}` | Add cpp.js plugin via `webpack(config)` callback; add `headers()` for COOP/COEP |
| `cppjs.config.{js,mjs}` *(new at root)* | Project-level cpp.js config |
| `src/native/` *(if user wraps own C++)* | `.h` + `.cpp` source |
| `public/` | Next serves `cpp.js` / `cpp.wasm` from `public/` if you copy them there post-build (alternative: webpack plugin's middleware) |

## Commands

```bash
pnpm add cpp.js @cpp.js/plugin-webpack @cpp.js/plugin-webpack-loader
pnpm add @cpp.js/package-<name>     # optional

# Dev
pnpm dev      # next dev

# Production
pnpm build && pnpm start    # next build && next start
```

## Reference config

`next.config.mjs`:

```js
import CppjsWebpackPlugin from '@cpp.js/plugin-webpack';

const cppjsWebpackPlugin = new CppjsWebpackPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config, { isServer }) {
        if (!isServer) {
            // cpp.js targets the client bundle; skip on server-side builds.
            config.module.rules.push(cppjsWebpackPlugin.getRule());
            config.plugins.push(cppjsWebpackPlugin);
        }
        return config;
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
                    { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
                ],
            },
        ];
    },
};

export default nextConfig;
```

`cppjs.config.mjs`:

```js
export default {
    general: { name: 'my-next-app' },
    target: { runtime: 'mt' },   // omit for single-thread default
    paths: { config: import.meta.url },
};
```

## Turbopack

Next 14+ ships Turbopack (`next dev --turbo`, default in Next 15+). **`@cpp.js/plugin-webpack` does not run under Turbopack** — Turbopack has its own plugin system that cpp.js doesn't yet target.

Workarounds while Turbopack support is pending:

1. Force webpack for dev: drop `--turbo`, run `next dev` (uses webpack).
2. Or build the cpp.js artifacts ahead of time and serve them statically:
   ```bash
   pnpm cppjs build -p wasm -a wasm32 -e browser -b release
   cp dist/<name>.browser.* public/
   ```
   Then `import` the loader from `/cpp.js` in your component. This skips the bundler integration entirely; you lose HMR for native source changes.

Track Turbopack support: open an issue against this repo if blocking.

## Multithread → COOP/COEP

The `headers()` callback in `next.config` covers both `next dev` and `next start`. For static export (`next export` / `output: 'export'`), headers won't work — the user must configure their hosting layer (see `docs/playbooks/integration/vite.md` "Multithread → production headers" for per-host recipes).

If `runtime: 'st'`, drop the `headers()` callback.

## Server vs client

cpp.js targets the **browser bundle**. The `next.config.webpack` callback above gates plugin registration on `!isServer` so SSR/build-time Node bundles don't try to load the wasm.

If the user wants cpp.js on the server side too (Node SSR with WASM), that's a separate integration:

- Build the Node target separately: `cppjs build -p wasm -e node`
- Import it in API routes / server components using `dynamic()` and `await import('./dist/<name>.node.js')`
- See `docs/playbooks/integration/nodejs.md` for the Node consumer side.

## Validation

- [ ] `pnpm install` succeeds.
- [ ] `pnpm dev` starts; client console shows the cpp.js loader running, no 404s on `/cpp.js`/`/cpp.wasm`.
- [ ] DevTools → Application → Headers shows `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` (for multithread).
- [ ] `pnpm build && pnpm start` works end-to-end.
- [ ] App calls into C++: `await initCppJs(); Module.fn(...)` returns expected result.

## Common pitfalls

- **Forgetting `!isServer` guard.** Without it, the server-side build tries to bundle wasm and Next's RSC compiler complains.
- **Using Turbopack.** Plugin doesn't run under Turbopack today. Disable `--turbo` or use the static-asset workaround.
- **Static export (`output: 'export'`).** `headers()` doesn't apply; user must configure the host (Vercel, Netlify, S3, …).
- **Mixing App Router + module-level `import` of the loader.** The loader fetches wasm at runtime; module-level top-level await may stall RSC. Init lazily inside a `useEffect` or async route handler.
- **`next.config.ts` (TypeScript config).** Make sure `tsconfig.json` includes the right `module`/`moduleResolution` for ESM imports of `@cpp.js/plugin-webpack`.
- **Plugin's devServer config ignored.** Next manages its own dev server — `cppjsWebpackPlugin.getDevServerConfig()` doesn't apply. Use Next's `headers()` callback for COOP/COEP and rely on Next's static asset serving for `/cpp.wasm`.

## Reference

- No canonical Next sample yet — closest is `cppjs-samples/cppjs-sample-web-react-rspack/` (similar webpack-based React setup).
- Plugin: `cppjs-plugins/cppjs-plugin-webpack/index.js`.
- Webpack/Rspack equivalent (with full devServer integration): `docs/playbooks/integration/webpack-rspack.md`.
