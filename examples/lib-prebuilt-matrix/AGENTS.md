# AGENTS.md — @crossbind/example-lib-prebuilt-matrix

> Canonical minimal **C++ library packaging** reference. This is what `docs/playbooks/new-package.md` (Persona 3) and most other samples point at when they need a small `@crossbind/port-*`-shaped consumable.

## What this sample is for

- Smallest possible working example of "I have a tiny C++ project, package it for crossbind so other samples / RN apps / web apps can consume it."
- Used by `examples/mobile-reactnative-cli`, `examples/backend-nodejs-wasm`, and a few playgrounds as their dependency.
- Reference for `crossbind.config.js` shape with `export.type: 'cmake'`.

## Layout

```
examples/lib-prebuilt-matrix/
├── src/                                  ← C++ source (matrix multiplier)
├── playground/                           ← optional standalone test
├── crossbind.config.js                       ← export.type cmake, base + output paths
├── examples/lib-prebuilt-matrix.podspec   ← iOS package manifest
├── examples/lib-prebuilt-matrix.xcframework  ← prebuilt iOS slices
├── dist/                                 ← built artifacts (committed for prebuilt consumption)
├── package.json
└── README.md
```

`dist/prebuilt/<target>/{lib,include}` is **committed** so consumers can `pnpm add @crossbind/example-lib-prebuilt-matrix` and link without rebuilding.

## Why a sample, not a real crossbind-package

Two reasons:
1. The matrix-multiplier C++ is too small to justify a full `ports/*` family; sample status keeps the surface light.
2. Demonstrates the inline alternative to packaging: the user's own C++ wrapped in a `crossbind.config.js` and exported as a workspace dep.

If you're looking at how a real prebuilt package is shaped, see `ports/zlib/` instead — that's the canonical for new `ports/*`.

## Build matrix

```bash
# Everything (default)
pnpm --filter=@crossbind/example-lib-prebuilt-matrix run build

# Per-platform
pnpm --filter=@crossbind/example-lib-prebuilt-matrix run build:wasm
pnpm --filter=@crossbind/example-lib-prebuilt-matrix run build:android
pnpm --filter=@crossbind/example-lib-prebuilt-matrix run build:ios          # macOS only
```

`prepublishOnly` runs `crossbind build` so `pnpm publish` always ships fresh artifacts.

## Common pitfalls

- **Treating this as a `ports/` template.** It's a sample first; for real package authoring follow `docs/playbooks/new-package.md` and mirror `ports/zlib/`.
- **Deleting committed `dist/prebuilt/`.** Consumers (`examples/mobile-reactnative-cli`, etc.) link against these artifacts. Rebuild + recommit if you change the C++.
- **Forgetting `prepublishOnly`.** Without it, npm could publish a stale `dist/`. The script is the safety net.
- **Adding a heavy native dep** (e.g. another package). Defeats the "smallest possible" purpose. Keep it tiny.
- **Wrapping with extra plugins** (Metro, Vite, etc.). The sample is plugin-free; consumers add their own plugins.

## Validation

```bash
# Build
pnpm --filter=@crossbind/example-lib-prebuilt-matrix run build

# Verify prebuilt artifacts
pnpm run check:dist | grep sample-lib-prebuilt-matrix

# Smoke a downstream consumer
pnpm --filter=@crossbind/example-backend-nodejs-wasm run build
node examples/backend-nodejs-wasm/src/index.js
```

## Reference

- Package author playbook (the real flow for `ports/*`): `docs/playbooks/new-package.md`
- Real-package canonical template: `ports/zlib/`
- Downstream consumers of this sample:
  - `examples/mobile-reactnative-cli/`
  - `examples/mobile-reactnative-expo/`
  - `examples/backend-nodejs-wasm/`
