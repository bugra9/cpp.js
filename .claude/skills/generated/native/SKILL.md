---
name: native
description: "Skill for the Native area of crossbind. 25 symbols across 13 files."
---

# Native

25 symbols | 13 files | Cohesion: 100%

## When to Use

- Working with code in `examples/`
- Understanding how hull_area, hull_wkt, hull_area work
- Modifying native-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `e2e/conformance/native/conformance.h` | area, scale, tag, ConfShape, ConfCircle (+2) |
| `e2e/config/native/geo_surface.rs` | hull_area, hull_wkt, hull |
| `e2e/mobile-reactnative-cli/src/native/geo_surface.rs` | hull_area, hull_wkt, hull |
| `e2e/web-vite/src/native/geo_surface.rs` | hull_area, hull_wkt, hull |
| `examples/backend-nodejs-wasm/src/native/native.cpp` | sample |
| `examples/lib-prebuilt-matrix/src/native/Matrix.h` | multiple |
| `examples/mobile-reactnative-cli/src/native/native.cpp` | sample |
| `examples/mobile-reactnative-expo/src/native/native.cpp` | sample |
| `examples/web-react-rspack/src/native/native.cpp` | sample |
| `examples/web-react-vite/src/native/native.cpp` | sample |

## Entry Points

Start here when exploring this area:

- **`hull_area`** (Function) — `e2e/config/native/geo_surface.rs:22`
- **`hull_wkt`** (Function) — `e2e/config/native/geo_surface.rs:25`
- **`hull_area`** (Function) — `e2e/mobile-reactnative-cli/src/native/geo_surface.rs:22`
- **`hull_wkt`** (Function) — `e2e/mobile-reactnative-cli/src/native/geo_surface.rs:25`
- **`hull_area`** (Function) — `e2e/web-vite/src/native/geo_surface.rs:22`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ConfShape` | Class | `e2e/conformance/native/conformance.h` | 49 |
| `ConfCircle` | Class | `e2e/conformance/native/conformance.h` | 56 |
| `hull_area` | Function | `e2e/config/native/geo_surface.rs` | 22 |
| `hull_wkt` | Function | `e2e/config/native/geo_surface.rs` | 25 |
| `hull_area` | Function | `e2e/mobile-reactnative-cli/src/native/geo_surface.rs` | 22 |
| `hull_wkt` | Function | `e2e/mobile-reactnative-cli/src/native/geo_surface.rs` | 25 |
| `hull_area` | Function | `e2e/web-vite/src/native/geo_surface.rs` | 22 |
| `hull_wkt` | Function | `e2e/web-vite/src/native/geo_surface.rs` | 25 |
| `sample` | Method | `examples/backend-nodejs-wasm/src/native/native.cpp` | 3 |
| `multiple` | Method | `examples/lib-prebuilt-matrix/src/native/Matrix.h` | 10 |
| `sample` | Method | `examples/mobile-reactnative-cli/src/native/native.cpp` | 3 |
| `sample` | Method | `examples/mobile-reactnative-expo/src/native/native.cpp` | 3 |
| `sample` | Method | `examples/web-react-rspack/src/native/native.cpp` | 3 |
| `sample` | Method | `examples/web-react-vite/src/native/native.cpp` | 3 |
| `sample` | Method | `examples/web-svelte-vite/src/native/native.cpp` | 3 |
| `sample` | Method | `examples/web-vanilla/src/native/native.cpp` | 3 |
| `sample` | Method | `examples/web-vue-vite/src/native/native.cpp` | 3 |
| `area` | Method | `e2e/conformance/native/conformance.h` | 26 |
| `scale` | Method | `e2e/conformance/native/conformance.h` | 28 |
| `tag` | Method | `e2e/conformance/native/conformance.h` | 29 |

## How to Explore

1. `context({name: "hull_area"})` — see callers and callees
2. `query({search_query: "native"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
