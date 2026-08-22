---
name: test
description: "Skill for the Test area of crossbind. 30 symbols across 11 files."
---

# Test

30 symbols | 11 files | Cohesion: 94%

## When to Use

- Working with code in `core/`
- Understanding how composeAdapters, lockHolderStatus, withDirLock work
- Modifying test-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `core/crossbind/test/workerVectorCoercion.test.js` | bindingError, fn, method, method, FakeVector (+2) |
| `core/crossbind/test/vectorCoercion.test.js` | constructor, bindingError, joinNames, PlainBag, FakeVector (+2) |
| `core/crossbind/src/utils/dirLock.js` | sleep, lockHolderStatus, withDirLock |
| `core/crossbind/test/exceptionDecode.test.js` | makeWasmException, makeFakeModule, boom |
| `core/crossbind/test/dirLock.test.js` | sleep, first |
| `core/crossbind/test/loadConfig.test.js` | project, appTree |
| `core/crossbind/test/workerEnum.test.js` | EnumVal, makeModule |
| `core/crossbind/src/assets/js-runtime/core.js` | composeAdapters |
| `e2e/backend-nodejs-multithread/src/index.mjs` | wait |
| `e2e/backend-nodejs/src/index.js` | wait |

## Entry Points

Start here when exploring this area:

- **`composeAdapters`** (Function) — `core/crossbind/src/assets/js-runtime/core.js:25`
- **`lockHolderStatus`** (Function) — `core/crossbind/src/utils/dirLock.js:14`
- **`withDirLock`** (Function) — `core/crossbind/src/utils/dirLock.js:32`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `composeAdapters` | Function | `core/crossbind/src/assets/js-runtime/core.js` | 25 |
| `lockHolderStatus` | Function | `core/crossbind/src/utils/dirLock.js` | 14 |
| `withDirLock` | Function | `core/crossbind/src/utils/dirLock.js` | 32 |
| `FakeVector` | Class | `core/crossbind/test/vectorCoercion.test.js` | 12 |
| `VectorString` | Class | `core/crossbind/test/vectorCoercion.test.js` | 35 |
| `VectorInt` | Class | `core/crossbind/test/vectorCoercion.test.js` | 36 |
| `FakeVector` | Class | `core/crossbind/test/workerVectorCoercion.test.js` | 8 |
| `VectorString` | Class | `core/crossbind/test/workerVectorCoercion.test.js` | 31 |
| `VectorDataset` | Class | `core/crossbind/test/workerVectorCoercion.test.js` | 32 |
| `EnumVal` | Class | `core/crossbind/test/workerEnum.test.js` | 7 |
| `sleep` | Function | `core/crossbind/src/utils/dirLock.js` | 9 |
| `bindingError` | Function | `core/crossbind/test/workerVectorCoercion.test.js` | 34 |
| `fn` | Function | `core/crossbind/test/workerVectorCoercion.test.js` | 61 |
| `wait` | Function | `e2e/backend-nodejs-multithread/src/index.mjs` | 3 |
| `wait` | Function | `e2e/backend-nodejs/src/index.js` | 2 |
| `wait` | Function | `e2e/backend-nodejs/src/index.mjs` | 2 |
| `bindingError` | Function | `core/crossbind/test/vectorCoercion.test.js` | 39 |
| `PlainBag` | Function | `core/crossbind/test/vectorCoercion.test.js` | 218 |
| `makeWasmException` | Function | `core/crossbind/test/exceptionDecode.test.js` | 14 |
| `makeFakeModule` | Function | `core/crossbind/test/exceptionDecode.test.js` | 61 |

## Connected Areas

| Area | Connections |
|------|-------------|
| E2e | 3 calls |

## How to Explore

1. `context({name: "composeAdapters"})` — see callers and callees
2. `query({search_query: "test"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
