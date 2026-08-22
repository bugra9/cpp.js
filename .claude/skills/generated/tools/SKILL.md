---
name: tools
description: "Skill for the Tools area of crossbind. 18 symbols across 8 files."
---

# Tools

18 symbols | 8 files | Cohesion: 74%

## When to Use

- Working with code in `core/`
- Understanding how findCrossbindRoot, handler, handler work
- Modifying tools-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `tooling/mcp/src/tools/detect-framework.js` | handler, resolveDetectScript, errorResponse |
| `tooling/mcp/src/run-script.js` | runNodeScript, runProcess, appendCapped |
| `tooling/mcp/src/repo-root.js` | findCrossbindRoot, requireCrossbindRoot |
| `tooling/mcp/src/tools/get-api-reference.js` | handler, errorResponse |
| `tooling/mcp/src/tools/check-native-versions.js` | handler, error |
| `tooling/mcp/src/tools/scaffold-package.js` | handler, error |
| `tooling/mcp/src/tools/build-package.js` | handler, error |
| `tooling/mcp/src/tools/doctor.js` | handler, error |

## Entry Points

Start here when exploring this area:

- **`findCrossbindRoot`** (Function) — `tooling/mcp/src/repo-root.js:5`
- **`handler`** (Function) — `tooling/mcp/src/tools/detect-framework.js:18`
- **`handler`** (Function) — `tooling/mcp/src/tools/get-api-reference.js:54`
- **`requireCrossbindRoot`** (Function) — `tooling/mcp/src/repo-root.js:17`
- **`runNodeScript`** (Function) — `tooling/mcp/src/run-script.js:48`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `findCrossbindRoot` | Function | `tooling/mcp/src/repo-root.js` | 5 |
| `handler` | Function | `tooling/mcp/src/tools/detect-framework.js` | 18 |
| `handler` | Function | `tooling/mcp/src/tools/get-api-reference.js` | 54 |
| `requireCrossbindRoot` | Function | `tooling/mcp/src/repo-root.js` | 17 |
| `runNodeScript` | Function | `tooling/mcp/src/run-script.js` | 48 |
| `handler` | Function | `tooling/mcp/src/tools/check-native-versions.js` | 15 |
| `handler` | Function | `tooling/mcp/src/tools/scaffold-package.js` | 20 |
| `runProcess` | Function | `tooling/mcp/src/run-script.js` | 4 |
| `handler` | Function | `tooling/mcp/src/tools/build-package.js` | 20 |
| `handler` | Function | `tooling/mcp/src/tools/doctor.js` | 13 |
| `resolveDetectScript` | Function | `tooling/mcp/src/tools/detect-framework.js` | 45 |
| `errorResponse` | Function | `tooling/mcp/src/tools/detect-framework.js` | 50 |
| `errorResponse` | Function | `tooling/mcp/src/tools/get-api-reference.js` | 85 |
| `error` | Function | `tooling/mcp/src/tools/check-native-versions.js` | 30 |
| `error` | Function | `tooling/mcp/src/tools/scaffold-package.js` | 45 |
| `appendCapped` | Function | `tooling/mcp/src/run-script.js` | 40 |
| `error` | Function | `tooling/mcp/src/tools/build-package.js` | 43 |
| `error` | Function | `tooling/mcp/src/tools/doctor.js` | 30 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Handler → IsAbs` | cross_community | 7 |
| `Handler → NormalizeArray` | cross_community | 7 |
| `Handler → IsAbs` | cross_community | 7 |
| `Handler → NormalizeArray` | cross_community | 7 |
| `Handler → IsAbs` | cross_community | 7 |
| `Handler → NormalizeArray` | cross_community | 7 |
| `Handler → IsAbs` | cross_community | 6 |
| `Handler → NormalizeArray` | cross_community | 6 |
| `Handler → IsAbs` | cross_community | 6 |
| `Handler → NormalizeArray` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| E2e | 1 calls |

## How to Explore

1. `context({name: "findCrossbindRoot"})` — see callers and callees
2. `query({search_query: "tools"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
