---
name: script
description: "Skill for the Script area of crossbind. 12 symbols across 4 files."
---

# Script

12 symbols | 4 files | Cohesion: 84%

## When to Use

- Working with code in `plugins/`
- Understanding how getDependenciesStamp, isIosLibsFresh, saveIosLibsStamp work
- Modifying script-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `plugins/react-native/script/iosLibCache.js` | computeStampHash, stampPath, isIosLibsFresh, saveIosLibsStamp |
| `plugins/react-native/script/bridgeCache.js` | computeStampHash, stampPath, isBridgeFresh, saveBridgeStamp |
| `plugins/react-native/script/build_js.js` | buildBridgeBundle, callResolveOptions, getModulePath |
| `core/crossbind/src/actions/buildDependencies.js` | getDependenciesStamp |

## Entry Points

Start here when exploring this area:

- **`getDependenciesStamp`** (Function) — `core/crossbind/src/actions/buildDependencies.js:101`
- **`isIosLibsFresh`** (Function) — `plugins/react-native/script/iosLibCache.js:31`
- **`saveIosLibsStamp`** (Function) — `plugins/react-native/script/iosLibCache.js:47`
- **`isBridgeFresh`** (Function) — `plugins/react-native/script/bridgeCache.js:25`
- **`saveBridgeStamp`** (Function) — `plugins/react-native/script/bridgeCache.js:38`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getDependenciesStamp` | Function | `core/crossbind/src/actions/buildDependencies.js` | 101 |
| `isIosLibsFresh` | Function | `plugins/react-native/script/iosLibCache.js` | 31 |
| `saveIosLibsStamp` | Function | `plugins/react-native/script/iosLibCache.js` | 47 |
| `isBridgeFresh` | Function | `plugins/react-native/script/bridgeCache.js` | 25 |
| `saveBridgeStamp` | Function | `plugins/react-native/script/bridgeCache.js` | 38 |
| `computeStampHash` | Function | `plugins/react-native/script/iosLibCache.js` | 11 |
| `stampPath` | Function | `plugins/react-native/script/iosLibCache.js` | 27 |
| `computeStampHash` | Function | `plugins/react-native/script/bridgeCache.js` | 10 |
| `stampPath` | Function | `plugins/react-native/script/bridgeCache.js` | 23 |
| `buildBridgeBundle` | Function | `plugins/react-native/script/build_js.js` | 21 |
| `callResolveOptions` | Function | `plugins/react-native/script/build_js.js` | 78 |
| `getModulePath` | Function | `plugins/react-native/script/build_js.js` | 91 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SaveIosLibsStamp → GetContentHash` | cross_community | 6 |
| `SaveBridgeStamp → FindFiles` | cross_community | 5 |
| `SaveBridgeStamp → GetContentHash` | cross_community | 5 |
| `SaveIosLibsStamp → FindFiles` | cross_community | 5 |
| `SaveIosLibsStamp → LoadJson` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Actions | 5 calls |

## How to Explore

1. `context({name: "getDependenciesStamp"})` — see callers and callees
2. `query({search_query: "script"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
