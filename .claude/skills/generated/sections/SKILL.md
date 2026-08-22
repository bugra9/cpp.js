---
name: sections
description: "Skill for the Sections area of crossbind. 23 symbols across 10 files."
---

# Sections

23 symbols | 10 files | Cohesion: 78%

## When to Use

- Working with code in `landing/`
- Understanding how App, CodeWindow, Pill work
- Modifying sections-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `landing/src/sections/Scaffolder.jsx` | prefersReducedMotion, ScaffoldTerminal, toneOf, ChoiceGroup, Chip (+1) |
| `landing/src/components/ui.jsx` | CodeWindow, Pill, highlight |
| `landing/src/sections/Showcase.jsx` | Libraries, Community, Showcase |
| `landing/src/sections/Hero.jsx` | RuntimeStrip, LanguageTabs, UniversalCode |
| `landing/src/App.jsx` | currentPath, App |
| `landing/src/sections/Features.jsx` | FeatureTag, Features |
| `landing/src/sections/Agent.jsx` | Agent |
| `landing/src/components/PlatformGlyph.jsx` | PlatformGlyph |
| `landing/src/data.js` | spell |
| `landing/src/guide/DocCode.jsx` | DocCode |

## Entry Points

Start here when exploring this area:

- **`App`** (Function) — `landing/src/App.jsx:23`
- **`CodeWindow`** (Function) — `landing/src/components/ui.jsx:22`
- **`Pill`** (Function) — `landing/src/components/ui.jsx:95`
- **`Agent`** (Function) — `landing/src/sections/Agent.jsx:3`
- **`Features`** (Function) — `landing/src/sections/Features.jsx:21`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `App` | Function | `landing/src/App.jsx` | 23 |
| `CodeWindow` | Function | `landing/src/components/ui.jsx` | 22 |
| `Pill` | Function | `landing/src/components/ui.jsx` | 95 |
| `Agent` | Function | `landing/src/sections/Agent.jsx` | 3 |
| `Features` | Function | `landing/src/sections/Features.jsx` | 21 |
| `Scaffolder` | Function | `landing/src/sections/Scaffolder.jsx` | 127 |
| `Showcase` | Function | `landing/src/sections/Showcase.jsx` | 103 |
| `PlatformGlyph` | Function | `landing/src/components/PlatformGlyph.jsx` | 1 |
| `highlight` | Function | `landing/src/components/ui.jsx` | 6 |
| `spell` | Function | `landing/src/data.js` | 60 |
| `DocCode` | Function | `landing/src/guide/DocCode.jsx` | 6 |
| `currentPath` | Function | `landing/src/App.jsx` | 18 |
| `FeatureTag` | Function | `landing/src/sections/Features.jsx` | 3 |
| `prefersReducedMotion` | Function | `landing/src/sections/Scaffolder.jsx` | 11 |
| `ScaffoldTerminal` | Function | `landing/src/sections/Scaffolder.jsx` | 14 |
| `toneOf` | Function | `landing/src/sections/Scaffolder.jsx` | 26 |
| `ChoiceGroup` | Function | `landing/src/sections/Scaffolder.jsx` | 96 |
| `Chip` | Function | `landing/src/sections/Scaffolder.jsx` | 107 |
| `Libraries` | Function | `landing/src/sections/Showcase.jsx` | 5 |
| `Community` | Function | `landing/src/sections/Showcase.jsx` | 51 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `App → LightTokens` | cross_community | 4 |
| `App → DarkTokens` | cross_community | 4 |
| `Guide → Highlight` | cross_community | 4 |
| `App → ReadStoredTheme` | cross_community | 3 |
| `App → NormalizePath` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Guide | 3 calls |
| Components | 3 calls |
| Cluster_286 | 2 calls |

## How to Explore

1. `context({name: "App"})` — see callers and callees
2. `query({search_query: "sections"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
