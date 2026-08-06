---
name: integrate-cppjs
description: Use this skill when the user wants to add cpp.js to an existing JavaScript / TypeScript / React Native project — phrases like "set up cpp.js with Vite / Next / Webpack / Rspack / Rollup / Cloudflare Workers / Node / vanilla HTML", "integrate @cpp.js/package-X into my app", "add cpp.js to my React Native project", "wire up GDAL in my Vue / React / Svelte / Solid app", "use cpp.js with my Expo project", "import a Rust crate (cargo:uuid) in my Vite / React Native app", "use a .rs file from JavaScript". Detect their framework first, then walk them through the matching playbook.
---

# integrate-cppjs

Walk the user through dropping cpp.js into their existing project.

## Step 0 — Detect the framework first

Don't guess. Inspect the user's `package.json` deps and project root for signature files. The cpp.js repo ships a detector script:

```bash
node scripts/detect-framework.js [path-to-project]
```

Returns JSON with `framework`, `confidence`, `evidence`, `recommendedPlaybook`. If `confidence` is `low` / `unknown`, ask the user before continuing.

Detection rules (in priority order):

| Framework | Dep / file signal |
|-----------|-------------------|
| react-native-expo | `expo` + `react-native` + `app.json` |
| react-native-cli | `react-native` (no `expo`) + `metro.config.js` |
| nextjs | `next` + `next.config.*` |
| cloudflare-worker | `wrangler` + `wrangler.{toml,jsonc,json}` |
| rspack | `@rspack/core` + `rspack.config.*` |
| webpack | `webpack` + `webpack.config.*` |
| vite | `vite` + `vite.config.*` |
| rollup | `rollup` (only) + `rollup.config.*` |
| nodejs | `cppjs build -e node` script, or `package.json` with `main`/`bin` and no bundler |
| vanilla | `index.html` at root, no bundler |

## Step 1 — Use the matching playbook

Each framework has a "Goal → When → Files → Commands → Validation → Pitfalls" recipe. Pull the relevant playbook from the cpp.js docs into context:

- vite → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/vite.md
- webpack-rspack → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/webpack-rspack.md
- rollup → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/rollup.md
- nextjs → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/nextjs.md
- react-native-cli → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/react-native-cli.md
- react-native-expo → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/react-native-expo.md
- cloudflare-worker → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/cloudflare-worker.md
- nodejs → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/nodejs.md
- vanilla → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/vanilla.md

Each playbook tells you:

1. Which plugin to install (`@cpp.js/plugin-vite`, `@cpp.js/plugin-webpack`, `@cpp.js/plugin-react-native`, …).
2. The exact config diff (with example).
3. Where to call `initCppJs(...)`.
4. Headers / build hooks specific to that bundler.
5. A canonical sample to mirror.

## Step 2 — Multithread decision

Ask once, early:

> Will this need multiple CPU threads (image processing, large data, crypto, geospatial)? Or is single-threaded fine?

| User answer | Recommend |
|-------------|-----------|
| Yes / perf-sensitive | `runtime: 'mt'` + COOP/COEP headers in production |
| No / simple use | `runtime: 'st'` (default), no headers needed |
| Not sure | Start with `st`; switching is a config flag away |

When recommending `mt`, name the host-specific config the user must edit (Vercel `vercel.json`, Netlify `_headers`, nginx, …) — the per-framework playbook lists them.

**Exceptions**:
- React Native (CLI / Expo): no COOP/COEP needed, threading uses pthreads via JSI.
- Cloudflare Workers: multithread not supported. Always `st`.

## Step 3 — Pick what to consume

```
Does cpp.js already prebuild a package for the user's library?
│
├─ Browse cppjs-packages/ (curl, expat, gdal, geos, geotiff, iconv,
│   jpegturbo, lerc, openssl, proj, spatialite, sqlite3, tiff, webp,
│   zlib, zstd) or https://cpp.js.org
│
├─ YES → pnpm add @cpp.js/package-<name> + matching plugin.
│
└─ NO → User has their own .cpp / a library not yet packaged.
          (a) Inline: write `cppjs.config.js` pointing at their src/native/.
          (b) Publish reusable package: invoke `package-cpp-library` skill.
          Most "my own code" cases want (a).
```

## Step 4 — Touch the config

Agent **may** edit `vite.config.*`, `next.config.*`, `metro.config.js`, `webpack.config.*`, `wrangler.toml`. Show the diff before applying when the file isn't blank.

Common touchpoints:

| File | Change |
|------|--------|
| `package.json` | + `cpp.js`, `@cpp.js/plugin-<bundler>`, optional `@cpp.js/package-<name>` |
| Bundler config | Register the cpp.js plugin |
| `cppjs.config.{js,mjs}` (new) | Project deps + build target |
| Public env / headers config | COOP/COEP for `mt` builds |

## Step 5 — Smoke build

After integrating:

```bash
pnpm install
pnpm dev      # framework-dependent
pnpm build
```

Verify the framework playbook's checklist: `crossOriginIsolated === true` (for `mt`), no 404s on `/cpp.js` / `/cpp.wasm`, the user's call into C++ returns expected result.

## Don't

- Skip framework detection.
- Edit bundler config blindly without showing the diff.
- Forget COOP/COEP in production for multithread builds (dev works, prod silently fails).
- Mix `mt` and `st` artifacts — be consistent.
- Suggest a hand-rolled webpack/rollup setup when the user's project already uses Vite/Next/etc.

## Reference

Full integration entry playbook: https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/README.md
