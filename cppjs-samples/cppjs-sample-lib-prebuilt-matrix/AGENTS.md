# AGENTS.md — @cpp.js/sample-lib-prebuilt-matrix

> Canonical minimal **C++ library packaging** reference. This is what `docs/playbooks/new-package.md` (Persona 3) and most other samples point at when they need a small `@cpp.js/package-*`-shaped consumable.

## What this sample is for

- Smallest possible working example of "I have a tiny C++ project, package it for cpp.js so other samples / RN apps / web apps can consume it."
- Used by `cppjs-sample-mobile-reactnative-cli`, `cppjs-sample-backend-nodejs-wasm`, and a few playgrounds as their dependency.
- Reference for `cppjs.config.js` shape with `export.type: 'cmake'`.

## Layout

```
cppjs-sample-lib-prebuilt-matrix/
├── src/                                  ← C++ source (matrix multiplier)
├── playground/                           ← optional standalone test
├── cppjs.config.js                       ← export.type cmake, base + output paths
├── cppjs-sample-lib-prebuilt-matrix.podspec   ← iOS package manifest
├── cppjs-sample-lib-prebuilt-matrix.xcframework  ← prebuilt iOS slices
├── dist/                                 ← built artifacts (committed for prebuilt consumption)
├── package.json
└── README.md
```

`dist/prebuilt/<target>/{lib,include}` is **committed** so consumers can `pnpm add @cpp.js/sample-lib-prebuilt-matrix` and link without rebuilding.

## Why a sample, not a real cppjs-package

Two reasons:
1. The matrix-multiplier C++ is too small to justify a full `cppjs-packages/*` family; sample status keeps the surface light.
2. Demonstrates the inline alternative to packaging: the user's own C++ wrapped in a `cppjs.config.js` and exported as a workspace dep.

If you're looking at how a real prebuilt package is shaped, see `cppjs-packages/cppjs-package-zlib/` instead — that's the canonical for new `cppjs-packages/*`.

## Build matrix

```bash
# Everything (default)
pnpm --filter=@cpp.js/sample-lib-prebuilt-matrix run build

# Per-platform
pnpm --filter=@cpp.js/sample-lib-prebuilt-matrix run build:wasm
pnpm --filter=@cpp.js/sample-lib-prebuilt-matrix run build:android
pnpm --filter=@cpp.js/sample-lib-prebuilt-matrix run build:ios          # macOS only
```

`prepublishOnly` runs `cppjs build` so `pnpm publish` always ships fresh artifacts.

## Common pitfalls

- **Treating this as a `cppjs-packages/` template.** It's a sample first; for real package authoring follow `docs/playbooks/new-package.md` and mirror `cppjs-package-zlib/`.
- **Deleting committed `dist/prebuilt/`.** Consumers (`cppjs-sample-mobile-reactnative-cli`, etc.) link against these artifacts. Rebuild + recommit if you change the C++.
- **Forgetting `prepublishOnly`.** Without it, npm could publish a stale `dist/`. The script is the safety net.
- **Adding a heavy native dep** (e.g. another package). Defeats the "smallest possible" purpose. Keep it tiny.
- **Wrapping with extra plugins** (Metro, Vite, etc.). The sample is plugin-free; consumers add their own plugins.

## Validation

```bash
# Build
pnpm --filter=@cpp.js/sample-lib-prebuilt-matrix run build

# Verify prebuilt artifacts
pnpm run check:dist | grep sample-lib-prebuilt-matrix

# Smoke a downstream consumer
pnpm --filter=@cpp.js/sample-backend-nodejs-wasm run build
node cppjs-samples/cppjs-sample-backend-nodejs-wasm/src/index.js
```

## Reference

- Package author playbook (the real flow for `cppjs-packages/*`): `docs/playbooks/new-package.md`
- Real-package canonical template: `cppjs-packages/cppjs-package-zlib/`
- Downstream consumers of this sample:
  - `cppjs-samples/cppjs-sample-mobile-reactnative-cli/`
  - `cppjs-samples/cppjs-sample-mobile-reactnative-expo/`
  - `cppjs-samples/cppjs-sample-backend-nodejs-wasm/`
