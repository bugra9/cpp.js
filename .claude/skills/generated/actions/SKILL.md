---
name: actions
description: "Skill for the Actions area of crossbind. 123 symbols across 50 files."
---

# Actions

123 symbols | 50 files | Cohesion: 79%

## When to Use

- Working with code in `core/`
- Understanding how buildBinTools, buildDependencies, buildExternal work
- Modifying actions-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `core/crossbind/src/actions/buildBinTools.js` | writeCommandStubs, buildBinTools, writeDerivedManifest, renderBinLicense, capitalize (+7) |
| `core/crossbind/src/utils/binTools.js` | renderBinJson, renderBinNpmignore, renderBinCommands, renderCommandStub, validateBinConfig (+2) |
| `core/crossbind/src/utils/cppDts.js` | tsType, parseArgs, bodyStatements, parseCppSurface, emitCppDts (+2) |
| `core/crossbind/src/bin.js` | build, createWasiCommands, createWasmJs, dockerContainerName, setSystemConfig (+1) |
| `core/crossbind/src/actions/licenses.js` | wasiToolchainRows, collectLicenseRows, findSourceDir, readLicenseTexts, bundledRowsOf (+1) |
| `core/crossbind/src/utils/dependencyRebuild.js` | isCached, getRebuildDeps, resolveSelector, orderByDependencies, computeDependenciesStamp |
| `core/crossbind/src/utils/licenseReport.js` | validateSpdx, formatNoticeSections, formatNoticesMarkdown, deriveLicenseExpression, isCopyleft |
| `core/crossbind/src/actions/target.js` | getTargetParams, getBuildTargets, getFilteredBuildTargets, getFilteredTargetSpec |
| `core/crossbind/src/state/index.js` | initProcessState, loadCacheState, setAllDependecyPaths, saveCache |
| `core/crossbind/src/utils/pullDockerImage.js` | getDockerImage, getDockerContainerName, isImagePresent, pullDockerImage |

## Entry Points

Start here when exploring this area:

- **`buildBinTools`** (Function) — `core/crossbind/src/actions/buildBinTools.js:208`
- **`buildDependencies`** (Function) — `core/crossbind/src/actions/buildDependencies.js:15`
- **`buildExternal`** (Function) — `core/crossbind/src/actions/buildExternal.js:8`
- **`buildJS`** (Function) — `core/crossbind/src/actions/buildJs.js:53`
- **`buildLib`** (Function) — `core/crossbind/src/actions/buildLib.js:9`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `buildBinTools` | Function | `core/crossbind/src/actions/buildBinTools.js` | 208 |
| `buildDependencies` | Function | `core/crossbind/src/actions/buildDependencies.js` | 15 |
| `buildExternal` | Function | `core/crossbind/src/actions/buildExternal.js` | 8 |
| `buildJS` | Function | `core/crossbind/src/actions/buildJs.js` | 53 |
| `buildLib` | Function | `core/crossbind/src/actions/buildLib.js` | 9 |
| `buildWasiCommand` | Function | `core/crossbind/src/actions/buildWasiCommand.js` | 11 |
| `buildWasm` | Function | `core/crossbind/src/actions/buildWasm.js` | 15 |
| `createLib` | Function | `core/crossbind/src/actions/createLib.js` | 17 |
| `createXCFramework` | Function | `core/crossbind/src/actions/createXCFramework.js` | 21 |
| `triggerExtensions` | Function | `core/crossbind/src/actions/extensions.js` | 2 |
| `getCmakeParameters` | Function | `core/crossbind/src/actions/getCmakeParameters.js` | 4 |
| `getData` | Function | `core/crossbind/src/actions/getData.js` | 40 |
| `getDependLibs` | Function | `core/crossbind/src/actions/getDependLibs.js` | 4 |
| `isNativeSourceNewerThan` | Function | `core/crossbind/src/actions/isSourceNewer.js` | 22 |
| `isSourceNewer` | Function | `core/crossbind/src/actions/isSourceNewer.js` | 32 |
| `getTargetParams` | Function | `core/crossbind/src/actions/target.js` | 9 |
| `getBuildTargets` | Function | `core/crossbind/src/actions/target.js` | 29 |
| `getFilteredBuildTargets` | Function | `core/crossbind/src/actions/target.js` | 40 |
| `getFilteredTargetSpec` | Function | `core/crossbind/src/actions/target.js` | 51 |
| `setAllDependecyPaths` | Function | `core/crossbind/src/state/index.js` | 71 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CreateCrateImportBridge → Log` | cross_community | 6 |
| `BuildLib → FilterTargetSpecs` | cross_community | 6 |
| `SaveIosLibsStamp → GetContentHash` | cross_community | 6 |
| `BuildWasiCommand → FilterTargetSpecs` | cross_community | 5 |
| `BuildCargo → Log` | cross_community | 5 |
| `BuildCargo → CfgOf` | cross_community | 5 |
| `BuildCargo → SkipBlock` | cross_community | 5 |
| `BuildCargo → Camel` | cross_community | 5 |
| `BuildCargo → AnyJson` | cross_community | 5 |
| `BuildCargo → IsRef` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| E2e | 2 calls |
| Cluster_35 | 2 calls |
| Integration | 1 calls |
| State | 1 calls |
| Cluster_33 | 1 calls |
| Cluster_30 | 1 calls |
| Test | 1 calls |

## How to Explore

1. `context({name: "buildBinTools"})` — see callers and callees
2. `query({search_query: "actions"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
