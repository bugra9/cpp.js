---
description: Integrate cpp.js into the user's existing project (Vite, Webpack/Rspack, Rollup, Next.js, RN-cli, RN-Expo, Cloudflare Worker, Node.js, vanilla HTML).
---

The user wants to add cpp.js to their existing JavaScript / TypeScript / React Native project. Walk them through it.

## Steps

1. **Detect the framework first.** Don't guess. Run:
   ```bash
   node scripts/detect-framework.js [path-to-project]
   ```
   (or inspect `package.json` deps + root config files manually). Confirm the result with the user if confidence is `low` / `unknown`.

2. **Load the matching playbook** from the cpp.js docs:
   - vite → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/vite.md
   - webpack-rspack → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/webpack-rspack.md
   - rollup → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/rollup.md
   - nextjs → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/nextjs.md
   - react-native-cli → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/react-native-cli.md
   - react-native-expo → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/react-native-expo.md
   - cloudflare-worker → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/cloudflare-worker.md
   - nodejs → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/nodejs.md
   - vanilla → https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/vanilla.md

3. **Ask the multithread question once, early.** If perf-sensitive (image / video / geo / crypto / large data) → recommend `runtime: 'mt'` + COOP/COEP for production. Otherwise default `runtime: 'st'`.
   - React Native: no COOP/COEP needed.
   - Cloudflare Worker: multithread not supported; always `st`.

4. **Pick what to consume:**
   - Existing prebuilt? `pnpm add @cpp.js/package-<name>` (curl, expat, gdal, geos, geotiff, iconv, jpegturbo, lerc, openssl, proj, spatialite, sqlite3, tiff, webp, zlib, zstd).
   - Their own C++? Inline via `cppjs.config.js` pointing at `src/native/`.
   - New library to publish? Run `/cppjs-package` instead.

5. **Edit the bundler config** following the playbook. Show the diff before applying.

6. **Smoke test:** `pnpm install`, `pnpm dev`, `pnpm build`. Verify no 404s on `/cpp.js`/`/cpp.wasm`, `crossOriginIsolated === true` for `mt` builds, expected return value from a C++ call.

## Don't

- Skip framework detection.
- Edit bundler configs blindly without showing the user the diff.
- Forget COOP/COEP in production (silent failure mode).
- Mix `mt` and `st` artifacts.

The full integration entry playbook is here: https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/README.md
