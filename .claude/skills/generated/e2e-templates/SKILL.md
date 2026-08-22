---
name: e2e-templates
description: "Skill for the E2e-templates area of crossbind. 26 symbols across 6 files."
---

# E2e-templates

26 symbols | 6 files | Cohesion: 85%

## When to Use

- Working with code in `scripts/`
- Understanding how previewAction, missingCaps, getFreePort work
- Modifying e2e-templates-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `scripts/e2e-templates/runner.js` | getFreePort, readJson, pickE2e, runTemplate, done (+2) |
| `scripts/e2e-templates/exec.js` | run, capture, timer, finish, commandOk (+1) |
| `scripts/e2e-templates/plan.js` | loadManifest, classify, scaffoldArgs, buildCaps, buildPlan |
| `scripts/e2e-templates/env.js` | missingCaps, hasAndroidSdk, hasAndroidDevice, detectEnv |
| `scripts/e2e-templates/source.js` | npmSource, localSource, resolveSource |
| `scripts/e2e-templates.js` | previewAction |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `previewAction` | Function | `scripts/e2e-templates.js` | 134 |
| `missingCaps` | Function | `scripts/e2e-templates/env.js` | 51 |
| `getFreePort` | Function | `scripts/e2e-templates/runner.js` | 26 |
| `readJson` | Function | `scripts/e2e-templates/runner.js` | 44 |
| `pickE2e` | Function | `scripts/e2e-templates/runner.js` | 54 |
| `runTemplate` | Function | `scripts/e2e-templates/runner.js` | 68 |
| `done` | Function | `scripts/e2e-templates/runner.js` | 78 |
| `skip` | Function | `scripts/e2e-templates/runner.js` | 111 |
| `run` | Function | `scripts/e2e-templates/exec.js` | 14 |
| `capture` | Function | `scripts/e2e-templates/exec.js` | 29 |
| `timer` | Function | `scripts/e2e-templates/exec.js` | 38 |
| `finish` | Function | `scripts/e2e-templates/exec.js` | 44 |
| `record` | Function | `scripts/e2e-templates/runner.js` | 101 |
| `npmSource` | Function | `scripts/e2e-templates/source.js` | 21 |
| `localSource` | Function | `scripts/e2e-templates/source.js` | 30 |
| `resolveSource` | Function | `scripts/e2e-templates/source.js` | 52 |
| `hasAndroidSdk` | Function | `scripts/e2e-templates/env.js` | 15 |
| `hasAndroidDevice` | Function | `scripts/e2e-templates/env.js` | 19 |
| `detectEnv` | Function | `scripts/e2e-templates/env.js` | 29 |
| `commandOk` | Function | `scripts/e2e-templates/exec.js` | 66 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `RunTemplate → IsAbs` | cross_community | 8 |
| `RunTemplate → NormalizeArray` | cross_community | 8 |
| `RunTemplate → Cwd` | cross_community | 6 |
| `RunTemplate → Capture` | cross_community | 5 |
| `Main → CommandOk` | cross_community | 4 |
| `Main → CommandOutput` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| E2e | 2 calls |

## How to Explore

1. `context({name: "previewAction"})` — see callers and callees
2. `query({search_query: "e2e-templates"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
