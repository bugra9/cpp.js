---
name: components
description: "Skill for the Components area of crossbind. 27 symbols across 17 files."
---

# Components

27 symbols | 17 files | Cohesion: 93%

## When to Use

- Working with code in `examples/`
- Understanding how useTheme, TabTwoScreen, HomeScreen work
- Modifying components-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `landing/src/components/Nav.jsx` | GitHubMark, ThemeIcon, iconButton, SearchIcon, Nav |
| `examples/mobile-reactnative-expo/src/components/app-tabs.web.tsx` | AppTabs, TabButton, CustomTabList |
| `examples/mobile-reactnative-expo/src/app/index.tsx` | getDevMenuHint, HomeScreen |
| `landing/src/components/ui.jsx` | GradientText, SecondaryButton |
| `landing/src/guide/nav.js` | guideHref, withRoute |
| `landing/src/sections/Hero.jsx` | ViewPrompt, Hero |
| `examples/mobile-reactnative-expo/src/hooks/use-theme.ts` | useTheme |
| `examples/mobile-reactnative-expo/src/app/explore.tsx` | TabTwoScreen |
| `examples/mobile-reactnative-expo/src/components/animated-icon.tsx` | AnimatedIcon |
| `examples/mobile-reactnative-expo/src/components/external-link.tsx` | ExternalLink |

## Entry Points

Start here when exploring this area:

- **`useTheme`** (Function) — `examples/mobile-reactnative-expo/src/hooks/use-theme.ts:8`
- **`TabTwoScreen`** (Function) — `examples/mobile-reactnative-expo/src/app/explore.tsx:14`
- **`HomeScreen`** (Function) — `examples/mobile-reactnative-expo/src/app/index.tsx:33`
- **`AnimatedIcon`** (Function) — `examples/mobile-reactnative-expo/src/components/animated-icon.tsx:82`
- **`AppTabs`** (Function) — `examples/mobile-reactnative-expo/src/components/app-tabs.web.tsx:18`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `useTheme` | Function | `examples/mobile-reactnative-expo/src/hooks/use-theme.ts` | 8 |
| `TabTwoScreen` | Function | `examples/mobile-reactnative-expo/src/app/explore.tsx` | 14 |
| `HomeScreen` | Function | `examples/mobile-reactnative-expo/src/app/index.tsx` | 33 |
| `AnimatedIcon` | Function | `examples/mobile-reactnative-expo/src/components/animated-icon.tsx` | 82 |
| `AppTabs` | Function | `examples/mobile-reactnative-expo/src/components/app-tabs.web.tsx` | 18 |
| `TabButton` | Function | `examples/mobile-reactnative-expo/src/components/app-tabs.web.tsx` | 36 |
| `CustomTabList` | Function | `examples/mobile-reactnative-expo/src/components/app-tabs.web.tsx` | 50 |
| `ExternalLink` | Function | `examples/mobile-reactnative-expo/src/components/external-link.tsx` | 6 |
| `HintRow` | Function | `examples/mobile-reactnative-expo/src/components/hint-row.tsx` | 13 |
| `ThemedText` | Function | `examples/mobile-reactnative-expo/src/components/themed-text.tsx` | 10 |
| `ThemedView` | Function | `examples/mobile-reactnative-expo/src/components/themed-view.tsx` | 11 |
| `Collapsible` | Function | `examples/mobile-reactnative-expo/src/components/ui/collapsible.tsx` | 10 |
| `WebBadge` | Function | `examples/mobile-reactnative-expo/src/components/web-badge.tsx` | 10 |
| `PromptModal` | Function | `landing/src/components/PromptModal.jsx` | 5 |
| `GradientText` | Function | `landing/src/components/ui.jsx` | 78 |
| `SecondaryButton` | Function | `landing/src/components/ui.jsx` | 117 |
| `guideHref` | Function | `landing/src/guide/nav.js` | 28 |
| `Closing` | Function | `landing/src/sections/Closing.jsx` | 5 |
| `Hero` | Function | `landing/src/sections/Hero.jsx` | 176 |
| `Nav` | Function | `landing/src/components/Nav.jsx` | 58 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HomeScreen → UseTheme` | intra_community | 4 |
| `AppTabs → UseTheme` | intra_community | 4 |
| `TabTwoScreen → UseTheme` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Sections | 1 calls |

## How to Explore

1. `context({name: "useTheme"})` — see callers and callees
2. `query({search_query: "components"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
