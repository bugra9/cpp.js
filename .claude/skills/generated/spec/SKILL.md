---
name: spec
description: "Skill for the Spec area of crossbind. 13 symbols across 7 files."
---

# Spec

13 symbols | 7 files | Cohesion: 87%

## When to Use

- Working with code in `examples/`
- Understanding how wrapModuleForCoercion, initNative, buildChecks work
- Modifying spec-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `e2e/conformance/spec/run.mjs` | section, buildChecks, add, encode, runConformance |
| `e2e/cloud-cloudflare-worker/index.js` | boot, bootNow, fetch |
| `core/crossbind/src/assets/js-runtime/adapters/vector-coercion.js` | wrapModuleForCoercion |
| `core/crossbind/src/assets/js-runtime/core.js` | initNative |
| `e2e/web-rspack/src/App.jsx` | App |
| `examples/web-react-rspack/src/App.jsx` | App |
| `examples/web-react-vite/src/App.jsx` | App |

## Entry Points

Start here when exploring this area:

- **`wrapModuleForCoercion`** (Function) — `core/crossbind/src/assets/js-runtime/adapters/vector-coercion.js:176`
- **`initNative`** (Function) — `core/crossbind/src/assets/js-runtime/core.js:159`
- **`buildChecks`** (Function) — `e2e/conformance/spec/run.mjs:26`
- **`add`** (Function) — `e2e/conformance/spec/run.mjs:28`
- **`runConformance`** (Function) — `e2e/conformance/spec/run.mjs:274`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `wrapModuleForCoercion` | Function | `core/crossbind/src/assets/js-runtime/adapters/vector-coercion.js` | 176 |
| `initNative` | Function | `core/crossbind/src/assets/js-runtime/core.js` | 159 |
| `buildChecks` | Function | `e2e/conformance/spec/run.mjs` | 26 |
| `add` | Function | `e2e/conformance/spec/run.mjs` | 28 |
| `runConformance` | Function | `e2e/conformance/spec/run.mjs` | 274 |
| `fetch` | Method | `e2e/cloud-cloudflare-worker/index.js` | 57 |
| `section` | Function | `e2e/conformance/spec/run.mjs` | 18 |
| `encode` | Function | `e2e/conformance/spec/run.mjs` | 272 |
| `boot` | Function | `e2e/cloud-cloudflare-worker/index.js` | 11 |
| `bootNow` | Function | `e2e/cloud-cloudflare-worker/index.js` | 16 |
| `App` | Function | `e2e/web-rspack/src/App.jsx` | 20 |
| `App` | Function | `examples/web-react-rspack/src/App.jsx` | 4 |
| `App` | Function | `examples/web-react-vite/src/App.jsx` | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Adapters | 3 calls |
| E2e | 1 calls |

## How to Explore

1. `context({name: "wrapModuleForCoercion"})` — see callers and callees
2. `query({search_query: "spec"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
