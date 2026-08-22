---
name: state
description: "Skill for the State area of crossbind. 12 symbols across 8 files."
---

# State

12 symbols | 8 files | Cohesion: 83%

## When to Use

- Working with code in `core/`
- Understanding how calculateDependencyParameters, setPath, getFilledConfig work
- Modifying state-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `core/crossbind/src/state/calculateDependencyParameters.js` | calculateDependencyParameters, setPath, getCmakeDepends, getCmakeDependsPathAndName |
| `core/crossbind/src/utils/getCMakeListsFilePath.js` | getCMakeListsFilePath, getCliCMakeListsFile |
| `core/crossbind/src/state/loadConfig.js` | getFilledConfig |
| `core/crossbind/src/utils/fixPackageName.js` | fixPackageName |
| `core/crossbind/src/utils/getAbsolutePath.js` | getAbsolutePath |
| `core/crossbind/src/utils/getParentPath.js` | getParentPath |
| `core/crossbind/src/utils/overrideDependency.js` | restampIdentity |
| `core/crossbind/test/loadConfig.test.js` | fill |

## Entry Points

Start here when exploring this area:

- **`calculateDependencyParameters`** (Function) — `core/crossbind/src/state/calculateDependencyParameters.js:0`
- **`setPath`** (Function) — `core/crossbind/src/state/calculateDependencyParameters.js:60`
- **`getFilledConfig`** (Function) — `core/crossbind/src/state/loadConfig.js:82`
- **`fixPackageName`** (Function) — `core/crossbind/src/utils/fixPackageName.js:0`
- **`getAbsolutePath`** (Function) — `core/crossbind/src/utils/getAbsolutePath.js:2`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `calculateDependencyParameters` | Function | `core/crossbind/src/state/calculateDependencyParameters.js` | 0 |
| `setPath` | Function | `core/crossbind/src/state/calculateDependencyParameters.js` | 60 |
| `getFilledConfig` | Function | `core/crossbind/src/state/loadConfig.js` | 82 |
| `fixPackageName` | Function | `core/crossbind/src/utils/fixPackageName.js` | 0 |
| `getAbsolutePath` | Function | `core/crossbind/src/utils/getAbsolutePath.js` | 2 |
| `getCMakeListsFilePath` | Function | `core/crossbind/src/utils/getCMakeListsFilePath.js` | 3 |
| `getCliCMakeListsFile` | Function | `core/crossbind/src/utils/getCMakeListsFilePath.js` | 13 |
| `getParentPath` | Function | `core/crossbind/src/utils/getParentPath.js` | 3 |
| `restampIdentity` | Function | `core/crossbind/src/utils/overrideDependency.js` | 48 |
| `getCmakeDepends` | Function | `core/crossbind/src/state/calculateDependencyParameters.js` | 31 |
| `getCmakeDependsPathAndName` | Function | `core/crossbind/src/state/calculateDependencyParameters.js` | 35 |
| `fill` | Function | `core/crossbind/test/loadConfig.test.js` | 36 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `LoadConfig → IdentityNames` | cross_community | 5 |
| `RebuildDependency → RestampIdentity` | cross_community | 4 |
| `RebuildDependency → GetParentPath` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Actions | 2 calls |
| Cluster_33 | 1 calls |
| E2e | 1 calls |

## How to Explore

1. `context({name: "calculateDependencyParameters"})` — see callers and callees
2. `query({search_query: "state"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
