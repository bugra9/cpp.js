---
name: scripts
description: "Skill for the Scripts area of crossbind. 99 symbols across 13 files."
---

# Scripts

99 symbols | 13 files | Cohesion: 95%

## When to Use

- Working with code in `scripts/`
- Understanding how pad, printTable, fmt work
- Modifying scripts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `scripts/check-native-versions.js` | pad, printTable, fmt, splitVersion, compareVersions (+17) |
| `scripts/check-external-dependencies.js` | pad, printTable, fmt, pinnedReason, splitVersion (+10) |
| `scripts/e2e-templates.js` | parseArgs, take, selectPlan, printTable, fmt (+5) |
| `scripts/check-beta-status.js` | pad, printTable, fmt, compareBetaVersions, parse (+4) |
| `website/scripts/sync-agent-docs.mjs` | rewriteLink, mapToAgentDest, rewriteAllLinks, stripFrontmatter, buildFrontmatter (+3) |
| `tooling/create-app/scripts/build-templates.js` | findAllPackageJsons, walk, buildVersionMap, main, rewriteWorkspaceDeps (+3) |
| `scripts/check-dist.js` | detectPlatform, loadConfigMeta, findPlatformPackages, checkPackage, main |
| `scripts/refresh-expo-sample.js` | addPackage, workspacePackages, dependencyClosure, read, main |
| `scripts/check-dependency-wiring.js` | referencedLibKeys, collectLinkFlags, scan, importDefault, libKeysOfFamily |
| `scripts/detect-framework.js` | readJsonSafe, gatherDeps, fileExistsAny, detect |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `pad` | Function | `scripts/check-external-dependencies.js` | 29 |
| `printTable` | Function | `scripts/check-external-dependencies.js` | 32 |
| `fmt` | Function | `scripts/check-external-dependencies.js` | 35 |
| `pinnedReason` | Function | `scripts/check-external-dependencies.js` | 87 |
| `splitVersion` | Function | `scripts/check-external-dependencies.js` | 102 |
| `compareVersions` | Function | `scripts/check-external-dependencies.js` | 111 |
| `parseRange` | Function | `scripts/check-external-dependencies.js` | 134 |
| `walkPackageJsons` | Function | `scripts/check-external-dependencies.js` | 172 |
| `collectPackageJsons` | Function | `scripts/check-external-dependencies.js` | 193 |
| `rewriteDependency` | Function | `scripts/check-external-dependencies.js` | 234 |
| `main` | Function | `scripts/check-external-dependencies.js` | 252 |
| `escapePipe` | Function | `scripts/check-external-dependencies.js` | 435 |
| `renderTable` | Function | `scripts/check-external-dependencies.js` | 436 |
| `pad` | Function | `scripts/check-native-versions.js` | 28 |
| `printTable` | Function | `scripts/check-native-versions.js` | 31 |
| `fmt` | Function | `scripts/check-native-versions.js` | 34 |
| `splitVersion` | Function | `scripts/check-native-versions.js` | 57 |
| `compareVersions` | Function | `scripts/check-native-versions.js` | 66 |
| `analyzeSegment` | Function | `scripts/check-native-versions.js` | 237 |
| `deriveSourceFromURLs` | Function | `scripts/check-native-versions.js` | 268 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Main → SplitVersion` | cross_community | 6 |
| `Main → FetchJson` | cross_community | 5 |
| `Main → IsAbs` | cross_community | 5 |
| `Main → NormalizeArray` | cross_community | 5 |
| `Main → Join` | cross_community | 5 |
| `Main → CommandOk` | cross_community | 4 |
| `Main → CommandOutput` | cross_community | 4 |
| `Main → AnalyzeSegment` | intra_community | 4 |
| `Main → EscapeRegex` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| E2e-templates | 5 calls |
| E2e | 1 calls |

## How to Explore

1. `context({name: "pad"})` — see callers and callees
2. `query({search_query: "scripts"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
