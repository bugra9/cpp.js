---
name: cluster-35
description: "Skill for the Cluster_35 area of crossbind. 18 symbols across 2 files."
---

# Cluster_35

18 symbols | 2 files | Cohesion: 75%

## When to Use

- Working with code in `core/`
- Understanding how resolveEmbindRustRoot, resolveFrom, embindRustVersion work
- Modifying cluster_35-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `core/crossbind/src/utils/rustBridgeGen.js` | generateRustBridge, createRustBridgeCrate, createCrateImportBridge, resolveEmbindRsDir, readCrateName (+10) |
| `core/crossbind/src/utils/resolveEmbindRust.js` | resolveEmbindRustRoot, resolveFrom, embindRustVersion |

## Entry Points

Start here when exploring this area:

- **`resolveEmbindRustRoot`** (Function) — `core/crossbind/src/utils/resolveEmbindRust.js:21`
- **`resolveFrom`** (Function) — `core/crossbind/src/utils/resolveEmbindRust.js:24`
- **`embindRustVersion`** (Function) — `core/crossbind/src/utils/resolveEmbindRust.js:59`
- **`generateRustBridge`** (Function) — `core/crossbind/src/utils/rustBridgeGen.js:65`
- **`createRustBridgeCrate`** (Function) — `core/crossbind/src/utils/rustBridgeGen.js:120`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `resolveEmbindRustRoot` | Function | `core/crossbind/src/utils/resolveEmbindRust.js` | 21 |
| `resolveFrom` | Function | `core/crossbind/src/utils/resolveEmbindRust.js` | 24 |
| `embindRustVersion` | Function | `core/crossbind/src/utils/resolveEmbindRust.js` | 59 |
| `generateRustBridge` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 65 |
| `createRustBridgeCrate` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 120 |
| `createCrateImportBridge` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 178 |
| `readCrateName` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 252 |
| `parseSurface` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 262 |
| `parseCrateSurface` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 271 |
| `emitDts` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 934 |
| `ts` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 936 |
| `resolveEmbindRsDir` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 246 |
| `newAcc` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 293 |
| `finalizeModel` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 450 |
| `anyJson` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 464 |
| `noteArc` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 473 |
| `noteAll` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 474 |
| `camel` | Function | `core/crossbind/src/utils/rustBridgeGen.js` | 651 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateCrateImportBridge → Log` | cross_community | 6 |
| `CreateCrateImportBridge → CfgOf` | cross_community | 5 |
| `CreateCrateImportBridge → SkipBlock` | cross_community | 5 |
| `CreateCrateImportBridge → NoteArc` | intra_community | 5 |
| `BuildCargo → Log` | cross_community | 5 |
| `BuildCargo → CfgOf` | cross_community | 5 |
| `BuildCargo → SkipBlock` | cross_community | 5 |
| `BuildCargo → Camel` | cross_community | 5 |
| `BuildCargo → AnyJson` | cross_community | 5 |
| `BuildCargo → IsRef` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Cluster_39 | 4 calls |
| Actions | 4 calls |
| Cluster_38 | 2 calls |

## How to Explore

1. `context({name: "resolveEmbindRustRoot"})` — see callers and callees
2. `query({search_query: "cluster_35"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
