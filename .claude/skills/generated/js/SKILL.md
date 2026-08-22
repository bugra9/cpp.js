---
name: js
description: "Skill for the Js area of crossbind. 206 symbols across 2 files."
---

# Js

206 symbols | 2 files | Cohesion: 71%

## When to Use

- Working with code in `core/`
- Understanding how get, isExportedByForceFilesystem, makeLegalFunctionName work
- Modifying js-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `core/embind-jsi/js/embind.js` | get, isExportedByForceFilesystem, makeLegalFunctionName, createNamedFunction, extendError (+197) |
| `core/embind-rust/e2e/demo.mjs` | UnboundTypeError, fromWireType, destructorFunction, crossbind_embind_raise_error |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `UnboundTypeError` | Class | `core/embind-rust/e2e/demo.mjs` | 1595 |
| `get` | Function | `core/embind-jsi/js/embind.js` | 108 |
| `isExportedByForceFilesystem` | Function | `core/embind-jsi/js/embind.js` | 1094 |
| `makeLegalFunctionName` | Function | `core/embind-jsi/js/embind.js` | 1204 |
| `createNamedFunction` | Function | `core/embind-jsi/js/embind.js` | 1215 |
| `extendError` | Function | `core/embind-jsi/js/embind.js` | 1225 |
| `throwBindingError` | Function | `core/embind-jsi/js/embind.js` | 1249 |
| `throwInternalError` | Function | `core/embind-jsi/js/embind.js` | 1258 |
| `whenDependentTypesAreResolved` | Function | `core/embind-jsi/js/embind.js` | 1261 |
| `onComplete` | Function | `core/embind-jsi/js/embind.js` | 1266 |
| `__embind_register_optional` | Function | `core/embind-jsi/js/embind.js` | 1408 |
| `runDestructors` | Function | `core/embind-jsi/js/embind.js` | 2296 |
| `newFunc` | Function | `core/embind-jsi/js/embind.js` | 2305 |
| `dummy` | Function | `core/embind-jsi/js/embind.js` | 2319 |
| `craftInvokerFunction` | Function | `core/embind-jsi/js/embind.js` | 2326 |
| `ensureOverloadTable` | Function | `core/embind-jsi/js/embind.js` | 2439 |
| `exposePublicSymbol` | Function | `core/embind-jsi/js/embind.js` | 2457 |
| `heap32VectorToArray` | Function | `core/embind-jsi/js/embind.js` | 2480 |
| `replacePublicSymbol` | Function | `core/embind-jsi/js/embind.js` | 2493 |
| `getDynCaller` | Function | `core/embind-jsi/js/embind.js` | 2509 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateDefaultDevices → Abort` | cross_community | 8 |
| `RegisteredPointer_fromWireType → Abort` | cross_community | 8 |
| `Rmdir → Abort` | cross_community | 7 |
| `Unlink → Abort` | cross_community | 7 |
| `CalculateAt → Abort` | cross_community | 6 |
| `CreatePath → Abort` | cross_community | 6 |
| `DoMsync → Abort` | cross_community | 6 |
| `Unmount → Abort` | cross_community | 5 |
| `ReadFile → Abort` | cross_community | 5 |
| `WriteFile → Abort` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| E2e | 1 calls |

## How to Explore

1. `context({name: "get"})` — see callers and callees
2. `query({search_query: "js"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
