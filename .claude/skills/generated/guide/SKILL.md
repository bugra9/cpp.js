---
name: guide
description: "Skill for the Guide area of crossbind. 30 symbols across 7 files."
---

# Guide

30 symbols | 7 files | Cohesion: 79%

## When to Use

- Working with code in `landing/`
- Understanding how Guide, getNeighbours, inline work
- Modifying guide-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `landing/src/guide/Guide.jsx` | useActiveHeading, SideLink, SideHeading, Sidebar, Toc (+2) |
| `landing/src/guide/Article.jsx` | List, Callout, Heading, Table, Cards (+1) |
| `landing/src/guide/search.js` | countOccurrences, scoreEntry, searchGuide, blockText, pageEntries |
| `landing/src/guide/nav.js` | getNeighbours, normalizePath, findGuidePage |
| `landing/src/guide/inline.jsx` | CodeSpan, Link, inline |
| `landing/src/main.jsx` | tree, headFor, prerender |
| `landing/src/guide/Search.jsx` | Search, move, onKeyDown |

## Entry Points

Start here when exploring this area:

- **`Guide`** (Function) — `landing/src/guide/Guide.jsx:157`
- **`getNeighbours`** (Function) — `landing/src/guide/nav.js:95`
- **`inline`** (Function) — `landing/src/guide/inline.jsx:39`
- **`normalizePath`** (Function) — `landing/src/guide/nav.js:84`
- **`findGuidePage`** (Function) — `landing/src/guide/nav.js:90`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `Guide` | Function | `landing/src/guide/Guide.jsx` | 157 |
| `getNeighbours` | Function | `landing/src/guide/nav.js` | 95 |
| `inline` | Function | `landing/src/guide/inline.jsx` | 39 |
| `normalizePath` | Function | `landing/src/guide/nav.js` | 84 |
| `findGuidePage` | Function | `landing/src/guide/nav.js` | 90 |
| `prerender` | Function | `landing/src/main.jsx` | 51 |
| `Article` | Function | `landing/src/guide/Article.jsx` | 159 |
| `Search` | Function | `landing/src/guide/Search.jsx` | 5 |
| `searchGuide` | Function | `landing/src/guide/search.js` | 95 |
| `move` | Function | `landing/src/guide/Search.jsx` | 37 |
| `onKeyDown` | Function | `landing/src/guide/Search.jsx` | 42 |
| `useActiveHeading` | Function | `landing/src/guide/Guide.jsx` | 14 |
| `SideLink` | Function | `landing/src/guide/Guide.jsx` | 35 |
| `SideHeading` | Function | `landing/src/guide/Guide.jsx` | 59 |
| `Sidebar` | Function | `landing/src/guide/Guide.jsx` | 74 |
| `Toc` | Function | `landing/src/guide/Guide.jsx` | 104 |
| `PrevNext` | Function | `landing/src/guide/Guide.jsx` | 122 |
| `List` | Function | `landing/src/guide/Article.jsx` | 36 |
| `Callout` | Function | `landing/src/guide/Article.jsx` | 47 |
| `CodeSpan` | Function | `landing/src/guide/inline.jsx` | 7 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Guide → CodeSpan` | cross_community | 5 |
| `Guide → Link` | cross_community | 5 |
| `Guide → Highlight` | cross_community | 4 |
| `App → NormalizePath` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Sections | 1 calls |

## How to Explore

1. `context({name: "Guide"})` — see callers and callees
2. `query({search_query: "guide"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
