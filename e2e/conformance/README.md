# @crossbind/conformance

Cross-runtime conformance kit: every documented C++ and Rust binding feature as ONE
data-driven check list, shared verbatim by the node, browser and React Native legs. Legs
wire only the surfaces their runtime model has; everything else is an explicit `SKIP` line
with the reason — never a silent gap. Known engine gaps found by this suite stay visible as
skips (search `KNOWN ENGINE GAP` in `spec/run.mjs`).

## Pieces

- `native/conformance.h` — header-only C++ surface (class/fields/methods, string/vector,
  shared_ptr factory, virtual dispatch, exceptions, `std::optional`). Bundler apps import it
  by package subpath (`@crossbind/conformance/native/conformance.h`); standalone builds list
  `../conformance/native` in `paths.header`.
- `spec/run.mjs` — `runConformance(surfaces)` returning `{ pass, run, skipped, summary,
  lines }`. Every binding call is awaited, so the same list serves synchronous (jsi, direct
  wasm) and worker-backed runtimes.

## Legs

| Leg | App | Run |
|-----|-----|-----|
| node st (direct module) | `crossbind-e2e-backend-nodejs` | `pnpm build && pnpm e2e:prod` |
| node mt (direct module, pthreads) | `crossbind-e2e-backend-nodejs-multithread` | `pnpm build && pnpm e2e:prod` |
| browser ×3 (vite plugin, worker-backed) | `crossbind-e2e-web-vite` | `pnpm build && playwright test --config playwright.prod.config.cjs` |
| browser ×3 (vite plugin, mt + worker) | `crossbind-e2e-web-vite-multithread` | `pnpm build && playwright test --config playwright.prod.config.cjs` |
| browser ×3 (webpack plugin via rspack, mt, worker-backed) | `crossbind-e2e-web-rspack` | `pnpm build && pnpm e2e:prod` |
| browser ×3 (no plugin, CLI standalone, mt) | `crossbind-e2e-web-vanilla` | `pnpm build && pnpm e2e:prod` |
| edge (cloudflare worker, direct module) | `crossbind-e2e-cloud-cloudflare-worker` | `pnpm build && playwright test --config playwright.dev.config.cjs` |
| Android + iOS (jsi) | `crossbind-e2e-mobile-reactnative-cli` | `pnpm run:android` / `pnpm run:ios` — the screen prints `CONFORMANCE pass/run` |

Plugin coverage: the legs exercise every bundler plugin in the repo — vite st and mt (the
vite plugin wraps `@crossbind/plugin-rollup`, so the rollup core rides along), webpack/rspack,
metro + react-native — plus the no-plugin standalone CLI flow on node (st and mt), in the
browser (vanilla) and on the edge. Note the browser mt runtimes are worker-backed at the
binding layer even when React 19 renders their thenable results as if they were sync.

Capability flags per leg: `caps.worker` marks the proxy contracts (vector returns arrive as
plain arrays, plain arrays coerce into vector params, enum values cross as identity-stable
transfer-handler tokens, live-JS values cannot cross). `caps.jsiNative` is accepted but
currently drives no skip: the engine-gap wave closed the jsi C++ gaps (fields, exception
messages, by-value vectors, `std::optional`), so the full direct-runtime list runs there.
The Rust surface runs in full on every leg its import model reaches.
