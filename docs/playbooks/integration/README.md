# Playbook — Integrate cpp.js into a JavaScript project

> **Persona 2** — Integrator. The user has an existing (or new) JavaScript / TypeScript / React Native project and wants to consume a `@cpp.js/package-*` (e.g. GDAL) **or** wrap their own C++ code from inside it.

## Goal

Drop cpp.js into the user's project with the smallest, most idiomatic config change for their framework. Choose the right plugin, wire up the bundler, set up COOP/COEP for multithread when needed, and verify with a smoke build.

## Step 0 — Detect the framework first

Don't guess. Run framework detection:

```bash
node scripts/detect-framework.js [path-to-project]
```

*(Sprint 2 helper. From outside this repo: copy `scripts/detect-framework.js` or describe the target's `package.json` and key config files.)*

The detector inspects `package.json` deps + filesystem signatures (`vite.config.*`, `next.config.*`, `metro.config.*`, `wrangler.toml`, etc.) and returns:

```json
{
  "framework": "vite" | "webpack" | "rspack" | "rollup" | "react-native-cli"
              | "react-native-expo" | "cloudflare-worker" | "nextjs"
              | "nodejs" | "vanilla" | "unknown",
  "confidence": "high" | "medium" | "low",
  "evidence": [...],
  "recommendedPlaybook": "docs/playbooks/integration/<framework>.md"
}
```

If `confidence` is `low` or `unknown`, **ask the user** before continuing.

## Step 1 — Decision tree

```
What does package.json deps + filesystem look like?
│
├─ has "vite"                         → docs/playbooks/integration/vite.md
├─ has "webpack" or "@rspack/*"        → docs/playbooks/integration/webpack-rspack.md
├─ has "rollup" (only)                 → docs/playbooks/integration/rollup.md
├─ has "next"                          → docs/playbooks/integration/nextjs.md
├─ has "react-native" + no "expo"      → docs/playbooks/integration/react-native-cli.md
├─ has "expo"                          → docs/playbooks/integration/react-native-expo.md
├─ has "wrangler" or worker config     → docs/playbooks/integration/cloudflare-worker.md
├─ Node-only project (no bundler)      → docs/playbooks/integration/nodejs.md
└─ plain HTML / no bundler             → docs/playbooks/integration/vanilla.md
```

Per-framework playbooks contain:

- Which plugin to install (`@cpp.js/plugin-vite`, etc.)
- The exact config diff
- Where to call `initCppJs(...)`
- Headers / build hooks specific to that bundler
- A reference sample (`cppjs-samples/cppjs-sample-web-vue-vite/`, etc.) to mirror

## Step 2 — Multithread decision

Ask once, early:

> Will this need to use multiple CPU threads (image processing, large data, crypto, geospatial)? Or is single-threaded fine?

| User answer | Recommend |
|-------------|-----------|
| "Yes, perf matters" / image / video / geo / crypto / large data | `runtime: 'mt'` + COOP/COEP headers in production |
| "No, simple use" / occasional one-off calls | `runtime: 'st'` (default), no headers needed |
| "Not sure" | Start with `st`; switching to `mt` later is a config flag away |

When recommending `mt`, **always** mention production headers:

> In dev/preview, the cpp.js bundler plugin sets these for you. In production, your hosting layer (Vercel, Netlify, Cloudflare, nginx, S3+CloudFront, …) must send:
>
> ```
> Cross-Origin-Opener-Policy: same-origin
> Cross-Origin-Embedder-Policy: require-corp
> ```
>
> Without them, browsers disable SharedArrayBuffer and threading silently fails.

The framework playbook will name the host-specific config file (`vercel.json`, `_headers`, nginx snippet, etc.).

## Step 3 — Pick what to consume

```
Does the user need a library cpp.js already prebuilds?
│
├─ Browse cppjs-packages/ (or https://cpp.js.org packages page) for matches:
│   gdal, openssl, geos, geotiff, proj, sqlite3, tiff, lerc, zstd, jpegturbo,
│   webp, iconv, expat, curl, zlib, spatialite
│
├─ YES → pnpm add @cpp.js/package-<name> + matching plugin.
│         Skip to Step 4.
│
└─ NO → User has their own .cpp / a library not yet packaged.
          Two sub-options:
            (a) Inline in their project: write `cppjs.config.js` pointing at
                their src/native/, no separate package needed.
            (b) Publish a reusable package: see docs/playbooks/new-package.md
                (Persona 3).
          Sub-option (a) is most common for "my own code".
```

## Step 4 — Touch the config files

The agent **may** edit the user's bundler config (`vite.config.*`, `next.config.*`, `metro.config.js`, `webpack.config.*`, `wrangler.toml`). Per-framework playbooks specify exactly what changes. Always show the diff before applying when the file isn't trivially blank.

Common touchpoints:

| File | What changes |
|------|--------------|
| `package.json` | + `@cpp.js/package-<name>`, + `@cpp.js/plugin-<bundler>` |
| `vite.config.*` / `webpack.config.*` / etc. | Add the cpp.js plugin to `plugins: []` |
| `cppjs.config.js` *(new)* | Project-level cpp.js config (deps to consume, build target) |
| Public env / headers config | COOP/COEP for `mt` builds in production |
| `tsconfig.json` *(if TS)* | No change needed — types ship with each `@cpp.js/package-*` |

## Step 5 — Smoke build

After integrating:

```bash
# Install
pnpm install

# Dev (verifies plugin wires up, bundler loads cpp.js)
pnpm dev   # or `pnpm start`, framework-dependent

# Production build
pnpm build
```

The framework playbook lists what to look for in the dev/build output (e.g. "you should see `cpp.js compiled for browser` in the log", "`/cpp.wasm` should be served at runtime").

## Validation

- [ ] Framework detected with `high` confidence (or user-confirmed otherwise).
- [ ] Correct plugin installed.
- [ ] Bundler config diff applied and explained to the user.
- [ ] Multithread decision made; if `mt`, COOP/COEP setup documented for the user's deploy target.
- [ ] `pnpm dev` succeeds, the bundle loads `cpp.js`/`cpp.wasm` without 404s.
- [ ] `pnpm build` produces artifacts.
- [ ] User can call into a cpp.js function from JS (e.g. `await initCppJs(); Module.someFn(...)` returns expected result).

## Common pitfalls

- **Wrong plugin for the bundler.** Vite ≠ Webpack ≠ Rspack ≠ Rollup. Use the framework playbook to pick.
- **Forgetting COOP/COEP in prod.** Dev works, prod fails silently with "SharedArrayBuffer is not defined". Always tell the user upfront.
- **Mixing `mt` and `st` artifacts.** Once the user picks a runtime, config it consistently. Don't half-migrate.
- **TypeScript in user project, expecting types from cpp.js.** Types ship per-package; if a `@cpp.js/package-*` lacks `.d.ts`, file an issue.
- **Editing config blindly.** Show the diff. Bundler configs are the user's source of truth — bad edits break their whole app, not just cpp.js.
- **Not using filter-detect on monorepos.** If the user's repo has multiple apps, run detection in the right subdir.

## Reference

- Plugin sources: `cppjs-plugins/cppjs-plugin-{vite,webpack,rollup,react-native,metro}/index.js`
- Sample integrations: `cppjs-samples/cppjs-sample-web-*` and `cppjs-samples/cppjs-sample-mobile-*`
- Framework detector: `scripts/detect-framework.js`
- Per-framework playbooks: `docs/playbooks/integration/<framework>.md` (added in Sprint 3)
