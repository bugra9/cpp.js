---
name: integration
description: "Skill for the Integration area of crossbind. 19 symbols across 8 files."
---

# Integration

19 symbols | 8 files | Cohesion: 82%

## When to Use

- Working with code in `core/`
- Understanding how createBridgeFile, getCrossbindScript, getRustJsScript work
- Modifying integration-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `core/crossbind/src/integration/getDependFilePath.js` | getExtRegex, existsCached, getAlias, getMatchingPackages, getLayoutSubdir (+2) |
| `core/crossbind/src/integration/getCrossbindScript.js` | getCrossbindScript, getRustJsScript, realCrateDir, buildScript |
| `core/crossbind/src/utils/cppFieldBindings.js` | buildFieldPropertyLines, injectFieldBindings |
| `plugins/rollup/index.js` | transform, resolveId |
| `core/crossbind/src/actions/createInterface.js` | createBridgeFile |
| `plugins/vite/index.js` | handleHotUpdate |
| `plugins/webpack-loader/index.js` | crossbindLoader |
| `plugins/webpack/index.js` | apply |

## Entry Points

Start here when exploring this area:

- **`createBridgeFile`** (Function) — `core/crossbind/src/actions/createInterface.js:11`
- **`getCrossbindScript`** (Function) — `core/crossbind/src/integration/getCrossbindScript.js:7`
- **`getRustJsScript`** (Function) — `core/crossbind/src/integration/getCrossbindScript.js:17`
- **`realCrateDir`** (Function) — `core/crossbind/src/integration/getCrossbindScript.js:20`
- **`buildFieldPropertyLines`** (Function) — `core/crossbind/src/utils/cppFieldBindings.js:5`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createBridgeFile` | Function | `core/crossbind/src/actions/createInterface.js` | 11 |
| `getCrossbindScript` | Function | `core/crossbind/src/integration/getCrossbindScript.js` | 7 |
| `getRustJsScript` | Function | `core/crossbind/src/integration/getCrossbindScript.js` | 17 |
| `realCrateDir` | Function | `core/crossbind/src/integration/getCrossbindScript.js` | 20 |
| `buildFieldPropertyLines` | Function | `core/crossbind/src/utils/cppFieldBindings.js` | 5 |
| `injectFieldBindings` | Function | `core/crossbind/src/utils/cppFieldBindings.js` | 9 |
| `getDependFilePath` | Function | `core/crossbind/src/integration/getDependFilePath.js` | 77 |
| `apply` | Method | `plugins/webpack/index.js` | 29 |
| `buildScript` | Function | `core/crossbind/src/integration/getCrossbindScript.js` | 71 |
| `crossbindLoader` | Function | `plugins/webpack-loader/index.js` | 0 |
| `getExtRegex` | Function | `core/crossbind/src/integration/getDependFilePath.js` | 7 |
| `existsCached` | Function | `core/crossbind/src/integration/getDependFilePath.js` | 21 |
| `getAlias` | Function | `core/crossbind/src/integration/getDependFilePath.js` | 28 |
| `getMatchingPackages` | Function | `core/crossbind/src/integration/getDependFilePath.js` | 42 |
| `getLayoutSubdir` | Function | `core/crossbind/src/integration/getDependFilePath.js` | 63 |
| `getFolderCandidates` | Function | `core/crossbind/src/integration/getDependFilePath.js` | 70 |
| `transform` | Method | `plugins/rollup/index.js` | 39 |
| `handleHotUpdate` | Method | `plugins/vite/index.js` | 79 |
| `resolveId` | Method | `plugins/rollup/index.js` | 28 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CrossbindLoader → NewAcc` | cross_community | 5 |
| `CrossbindLoader → Log` | cross_community | 5 |
| `CrossbindLoader → CfgOf` | cross_community | 5 |
| `CrossbindLoader → SkipBlock` | cross_community | 5 |
| `HandleHotUpdate → BuildFieldPropertyLines` | intra_community | 4 |
| `HandleHotUpdate → BodyStatements` | cross_community | 4 |
| `HandleHotUpdate → TsType` | cross_community | 4 |
| `HandleHotUpdate → Log` | cross_community | 4 |
| `HandleHotUpdate → GetContentHash` | cross_community | 4 |
| `HandleHotUpdate → IsMtWasm` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Actions | 9 calls |
| Cluster_35 | 3 calls |

## How to Explore

1. `context({name: "createBridgeFile"})` — see callers and callees
2. `query({search_query: "integration"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
