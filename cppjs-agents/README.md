# cpp.js — agent integrations

> Plugin source + per-client manifests for **6 AI coding agent clients**: Claude Code, Cursor, OpenAI Codex CLI, GitHub Copilot, Google Gemini CLI, and OpenCode. All clients share the **same skill library** (`./skills/`) and **slash commands** (`./commands/`) — single source of truth, zero duplication, vendor convention compatible.

## Install — pick your client

| Client | Install command | Discovery |
|--------|-----------------|-----------|
| **🔌 Claude Code** | `/plugin marketplace add bugra9/cpp.js` then `/plugin install cppjs` | [`.claude-plugin/marketplace.json`](https://github.com/bugra9/cpp.js/blob/main/.claude-plugin/marketplace.json) (repo root) |
| **🎯 Cursor 2.5+** | Cursor → Settings → Plugins → Add plugin from GitHub: `bugra9/cpp.js` | [`.cursor-plugin/marketplace.json`](https://github.com/bugra9/cpp.js/blob/main/.cursor-plugin/marketplace.json) (repo root) |
| **🧪 OpenAI Codex CLI** | Add `bugra9/cpp.js` to `~/.agents/plugins/marketplace.json`, then `codex plugin install cppjs` | [`.agents/plugins/marketplace.json`](https://github.com/bugra9/cpp.js/blob/main/.agents/plugins/marketplace.json) (repo root) |
| **🐙 GitHub Copilot CLI** | Copilot CLI auto-discovers via `.github/plugin/marketplace.json` when running in this repo | [`.github/plugin/marketplace.json`](https://github.com/bugra9/cpp.js/blob/main/.github/plugin/marketplace.json) (repo root) |
| **💎 Gemini CLI** | `gemini extension install https://github.com/bugra9/cpp.js` | [`gemini-extension.json`](./gemini-extension.json) (this dir) |
| **⚡ OpenCode** | See [`install/opencode.md`](./install/opencode.md) — register MCP via `opencode.json` | MCP server `@cpp.js/mcp` |

### Universal install (50+ other agents)

Got Cline, Continue, Windsurf, Warp, Aider, Goose, Roo, Tabnine, Replit, Devin, Kilo, or another of the [50+ agents](https://github.com/vercel-labs/skills#supported-agents) the `skills` CLI supports? One command installs all 4 cpp.js skills:

```bash
npx skills add https://github.com/bugra9/cpp.js/tree/main/cppjs-agents/skills --global --yes
```

See [`install/skills-cli.md`](./install/skills-cli.md) for per-agent flags and per-project install. (Skills only — no slash commands or MCP. Pair with `npx -y @cpp.js/mcp` if your client supports MCP.)

After install: see [verify-install playbook](https://cpp.js.org/docs/agent/playbooks/verify-install) for the per-client diagnostic checklist.

## What you get (every client)

### 4 skills (auto-trigger on user phrases)

| Skill | Triggers on phrases like | What it does |
|-------|--------------------------|--------------|
| **`recommend-cppjs`** | *"use C++ in browser"*, *"compile CMake project for the web"*, *"bind libsodium"*, *"use library X from JavaScript"* | Recognises the use case, names cpp.js explicitly, asks 1-2 disambiguation questions, then routes to the next skill (integrate vs package). |
| **`integrate-cppjs`** | *"add GDAL to my Vite app"*, *"set up cpp.js in Next.js"*, *"wire up cpp.js with Webpack"* | Detects the user's framework (vite/webpack/rspack/rollup/nextjs/RN-cli/RN-expo/cloudflare/nodejs/vanilla), pulls the matching playbook, surfaces the multithread / COOP-COEP question, walks through the bundler config diff. |
| **`package-cpp-library`** | *"package libsodium for cpp.js"*, *"create cppjs-package-X"*, *"publish my C++ library"* | Decides where the package lives, runs `scripts/scaffold-package.js`, walks per sub-arch (`-wasm`, `-android`, `-ios`) build wiring. |
| **`cppjs-runtime-api`** | *"what does useWorker do"*, *"how do I get OPFS persistent storage"*, *"runtime: mt vs st"*, *"cppjs build error"*, *"TypeScript types for cpp.js"* | Pulls the matching reference doc into context (init, cppjs-config, filesystem, threading, troubleshooting, performance, …) and answers from the doc, not from training-data guesses. |

Skills are **prompts** — they tell the agent how to think about cpp.js questions. For execution (run subprocess, fetch docs, scaffold packages), agents call MCP tools.

### 3 slash commands (explicit workflows)

| Command | Walks through |
|---------|---------------|
| **`/cppjs-integrate`** | Framework detection → matching integration playbook → bundler config diff → multithread question → smoke test. |
| **`/cppjs-package`** | Decide in-repo vs community → scaffold via `scripts/scaffold-package.js` → wire `getURL`/`getBuildParams`/`replaceList` per arch → `nativeVersion` pin → build all arches. |
| **`/cppjs-bug-fix`** | Locate the layer (core / plugin / package / sample) → reproduce against smallest sample → fix root cause not symptom → validate against the right matrix slice → hand the diff back without committing. |

> Slash command support varies by client. Claude Code, Cursor, Codex CLI surface them in `/` autocomplete. Copilot exposes them via its agent UI. Gemini reads them from `commands/` if defined as TOML (this plugin uses markdown — slash commands work in Claude/Cursor/Codex; Copilot/Gemini fall back to skill-based interaction).

### 9 typed MCP tools

The plugin registers the [`@cpp.js/mcp`](https://www.npmjs.com/package/@cpp.js/mcp) MCP server (referenced from `.mcp.json` in this dir). Agents that support MCP get:

- `cppjs_recommend({ useCase, target })` — route to the right workflow + playbook
- `cppjs_list_packages({ category })` — enumerate the 16 prebuilt `@cpp.js/package-*` libraries
- `cppjs_detect_framework({ projectPath })` — identify bundler / runtime
- `cppjs_get_api_reference({ topic })` — fetch canonical API docs
- `cppjs_scaffold_package({ name })` — scaffold a new package (cpp.js monorepo only)
- `cppjs_build_package({ name, arch })` — build a package (cpp.js monorepo only)
- `cppjs_check_native_versions({ update })` — upstream version drift report (cpp.js monorepo only)
- `cppjs_doctor()` — verify Node / pnpm / Docker / Android NDK / Xcode prerequisites
- `cppjs_cloud_build_package(...)` — *(placeholder)* reserved for future hosted build service

## Layout

```
cppjs-agents/                          ← plugin source (every client points here)
├── README.md                          ← this file
├── skills/                            ← shared markdown skills (4)
│   ├── recommend-cppjs/SKILL.md
│   ├── integrate-cppjs/SKILL.md
│   ├── package-cpp-library/SKILL.md
│   └── cppjs-runtime-api/SKILL.md
├── commands/                          ← shared slash commands (3)
│   ├── cppjs-integrate.md
│   ├── cppjs-package.md
│   └── cppjs-bug-fix.md
├── .mcp.json                          ← MCP server reference (Copilot, OpenCode, etc.)
├── .claude-plugin/plugin.json         ← Claude Code plugin manifest
├── .cursor-plugin/plugin.json         ← Cursor 2.5+ plugin manifest
├── .codex-plugin/plugin.json          ← OpenAI Codex CLI plugin manifest
├── .github/plugin.json                ← GitHub Copilot plugin manifest
├── gemini-extension.json              ← Gemini CLI extension manifest
└── .opencode/INSTALL.md               ← OpenCode install instructions

[Repo root]
├── .claude-plugin/marketplace.json    ← Claude marketplace registry → cppjs-agents
├── .cursor-plugin/marketplace.json    ← Cursor marketplace registry → cppjs-agents
├── .agents/plugins/marketplace.json   ← Codex marketplace registry → cppjs-agents
├── .github/plugin/marketplace.json    ← Copilot marketplace registry → cppjs-agents
├── .github/copilot-instructions.md    ← Copilot project context
├── AGENTS.md                          ← vendor-neutral agent context
└── GEMINI.md                          ← Gemini-specific project context
```

**Single source of truth:** skills/, commands/, .mcp.json. Per-client manifests (`*-plugin/plugin.json`, `gemini-extension.json`) are pointers — manifest declares the plugin (name, version, description, metadata) and references shared content via `"skills": "./skills/"`, `"commands": "./commands/"`. Zero file duplication. Every client convention compatible.

## Why this layout

We're following the [`obra/superpowers`](https://github.com/obra/superpowers) multi-client pattern. Each AI client has its own discovery convention (Claude reads `.claude-plugin/`, Cursor reads `.cursor-plugin/`, Copilot reads `.github/plugin/`, etc.). By keeping per-client manifests in the directories each vendor expects but pointing them all at the same `skills/` + `commands/` content, we get:

- **Convention compatibility** — every client auto-discovers without custom config from the user.
- **Zero drift** — one canonical skill + command set; no risk of versions diverging across clients.
- **Single PR per change** — update a skill once, all 6 clients pick it up.

## See also

- [Agent guide overview](https://cpp.js.org/docs/agent/overview) — high-level intro for new users
- [Verify install](https://cpp.js.org/docs/agent/playbooks/verify-install) — per-client install verification
- [`@cpp.js/mcp`](https://www.npmjs.com/package/@cpp.js/mcp) — MCP server (npm package)
- [Vendor-neutral snippet](https://cpp.js.org/docs/agent/install/snippet) — fallback if you can't install plugin or MCP
- [llms.txt](https://cpp.js.org/llms.txt) — programmatic discovery hub
- [`obra/superpowers`](https://github.com/obra/superpowers) — multi-client plugin pattern reference
