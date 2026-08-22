---
name: e2e
description: "Skill for the E2e area of crossbind. 319 symbols across 37 files."
---

# E2e

319 symbols | 37 files | Cohesion: 81%

## When to Use

- Working with code in `core/`
- Understanding how mergeSpecs, run, targetPathOf work
- Modifying e2e-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `core/embind-rust/e2e/demo.mjs` | basename, open, read, write, get_char (+191) |
| `core/embind-rust/e2e/jsi-shape-check.cpp` | P, crossbind_tid_int, crossbind_tid_std_string, crossbind_tid_int64, crossbind_tid_uint64 (+16) |
| `core/crossbind/src/runtime/wasiRun.mjs` | walkConfigGraph, visit, prebuiltOf, mergeSpecs, run |
| `ports/curl/bin-wasi/e2e/run.mjs` | runWasm, tool, toolIn, toolFail, toolAny |
| `ports/expat/bin-wasi/e2e/run.mjs` | runWasm, tool, toolIn, toolFail, toolAny |
| `ports/geos/bin-wasi/e2e/run.mjs` | runWasm, tool, toolIn, toolFail, toolAny |
| `ports/geotiff/bin-wasi/e2e/run.mjs` | runWasm, tool, toolIn, toolFail, toolAny |
| `ports/jpegturbo/bin-wasi/e2e/run.mjs` | runWasm, tool, toolIn, toolFail, toolAny |
| `ports/openssl/bin-wasi/e2e/run.mjs` | runWasm, tool, toolIn, toolFail, toolAny |
| `ports/proj/bin-wasi/e2e/run.mjs` | runWasm, tool, toolIn, toolFail, toolAny |

## Entry Points

Start here when exploring this area:

- **`mergeSpecs`** (Function) — `core/crossbind/src/runtime/wasiRun.mjs:32`
- **`run`** (Function) — `core/crossbind/src/runtime/wasiRun.mjs:41`
- **`targetPathOf`** (Function) — `core/crossbind/src/utils/targets.js:96`
- **`filterTargetSpecs`** (Function) — `core/crossbind/src/utils/targets.js:100`
- **`crossbind_tid_int`** (Function) — `core/embind-rust/e2e/jsi-shape-check.cpp:41`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `mergeSpecs` | Function | `core/crossbind/src/runtime/wasiRun.mjs` | 32 |
| `run` | Function | `core/crossbind/src/runtime/wasiRun.mjs` | 41 |
| `targetPathOf` | Function | `core/crossbind/src/utils/targets.js` | 96 |
| `filterTargetSpecs` | Function | `core/crossbind/src/utils/targets.js` | 100 |
| `crossbind_tid_int` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 41 |
| `crossbind_tid_std_string` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 45 |
| `crossbind_tid_int64` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 46 |
| `crossbind_tid_uint64` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 47 |
| `crossbind_tid_optional_int` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 48 |
| `crossbind_tid_optional_string` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 51 |
| `crossbind_embind_register_class_constructor` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 179 |
| `crossbind_embind_register_class_function` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 190 |
| `crossbind_embind_register_class_class_function` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 198 |
| `crossbind_embind_register_function` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 207 |
| `createBaseModule` | Function | `core/crossbind/src/assets/js-runtime/core.js` | 75 |
| `createModule` | Function | `core/crossbind/src/assets/js-runtime/core.js` | 151 |
| `crossbind_embind_raise_error` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 73 |
| `crossbind_embind_register_class` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 168 |
| `crossbind_embind_register_smart_ptr` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 214 |
| `main` | Function | `core/embind-rust/e2e/jsi-shape-check.cpp` | 297 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateDefaultDevices → Abort` | cross_community | 8 |
| `RunTemplate → IsAbs` | cross_community | 8 |
| `RunTemplate → NormalizeArray` | cross_community | 8 |
| `RegisteredPointer_fromWireType → Abort` | cross_community | 8 |
| `Init → ThrowBindingError` | cross_community | 7 |
| `Rmdir → Abort` | cross_community | 7 |
| `Unlink → Abort` | cross_community | 7 |
| `CreateDefaultDevices → IsDir` | cross_community | 7 |
| `CreateDefaultDevices → NodePermissions` | cross_community | 7 |
| `Handler → IsAbs` | cross_community | 7 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Js | 11 calls |

## How to Explore

1. `context({name: "mergeSpecs"})` — see callers and callees
2. `query({search_query: "e2e"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
