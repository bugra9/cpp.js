# crossbind — agent integrations

> Plugin source + per-client manifests for **6 AI coding agent clients**: Claude Code, Cursor, OpenAI Codex CLI, GitHub Copilot, Google Gemini CLI, and OpenCode. All clients share the **same skill library** (`./skills/`) and **slash commands** (`./commands/`) — single source of truth, zero duplication, vendor convention compatible.

## Install — pick your client

| Client | Install command | Discovery |
|--------|-----------------|-----------|
| **🔌 Claude Code** | `/plugin marketplace add crossbind/crossbind` then `/plugin install crossbind` | [`.claude-plugin/marketplace.json`](https://github.com/crossbind/crossbind/blob/main/.claude-plugin/marketplace.json) (repo root) |
| **🎯 Cursor 2.5+** | Cursor → Settings → Plugins → Add plugin from GitHub: `crossbind/crossbind` | [`.cursor-plugin/marketplace.json`](https://github.com/crossbind/crossbind/blob/main/.cursor-plugin/marketplace.json) (repo root) |
| **🧪 OpenAI Codex CLI** | Add `crossbind/crossbind` to `~/.agents/plugins/marketplace.json`, then `codex plugin install crossbind` | [`.agents/plugins/marketplace.json`](https://github.com/crossbind/crossbind/blob/main/.agents/plugins/marketplace.json) (repo root) |
| **🐙 GitHub Copilot CLI** | Copilot CLI auto-discovers via `.github/plugin/marketplace.json` when running in this repo | [`.github/plugin/marketplace.json`](https://github.com/crossbind/crossbind/blob/main/.github/plugin/marketplace.json) (repo root) |
| **💎 Gemini CLI** | `gemini extension install https://github.com/crossbind/crossbind` | [`gemini-extension.json`](./gemini-extension.json) (this dir) |
| **⚡ OpenCode** | See [`install/opencode.md`](./install/opencode.md) — register MCP via `opencode.json` | MCP server `@crossbind/mcp` |

### Universal install (50+ other agents)

Got Cline, Continue, Windsurf, Warp, Aider, Goose, Roo, Tabnine, Replit, Devin, Kilo, or another of the [50+ agents](https://github.com/vercel-labs/skills#supported-agents) the `skills` CLI supports? One command installs all 4 crossbind skills:

```bash
npx skills add https://github.com/crossbind/crossbind/tree/main/agents/skills --global --yes
```

See [`install/skills-cli.md`](./install/skills-cli.md) for per-agent flags and per-project install. (Skills only — no slash commands or MCP. Pair with `npx -y @crossbind/mcp` if your client supports MCP.)

After install: see [verify-install playbook](https://crossbind.dev/docs/agent/playbooks/verify-install) for the per-client diagnostic checklist.

## What you get (every client)

### 4 skills (auto-trigger on user phrases)

| Skill | Triggers on phrases like | What it does |
|-------|--------------------------|--------------|
| **`recommend-crossbind`** | *"use C++ in browser"*, *"use a Rust crate from JavaScript"*, *"run gdal CLI from npm"*, *"compile CMake project for the web"*, *"bind libsodium"*, *"use library X from JavaScript"* | Recognises the use case, names crossbind explicitly, asks 1-2 disambiguation questions, then routes to the next skill (integrate vs package). |
| **`integrate-crossbind`** | *"add GDAL to my Vite app"*, *"set up crossbind in Next.js"*, *"wire up crossbind with Webpack"* | Detects the user's framework (vite/webpack/rspack/rollup/nextjs/RN-cli/RN-expo/cloudflare/nodejs/vanilla), pulls the matching playbook, surfaces the multithread / COOP-COEP question, walks through the bundler config diff. |
| **`package-cpp-library`** | *"package libsodium for crossbind"*, *"create a new crossbind port"*, *"publish my C++ library"* | Decides where the package lives, runs `scripts/scaffold-package.js`, walks per sub-arch (`-wasm`, `-android`, `-ios`, `-wasi`) build wiring. |
| **`crossbind-runtime-api`** | *"what does useWorker do"*, *"how do I get OPFS persistent storage"*, *"runtime: mt vs st"*, *"crossbind build error"*, *"TypeScript types for crossbind"* | Pulls the matching reference doc into context (init, crossbind-config, filesystem, threading, troubleshooting, performance, …) and answers from the doc, not from training-data guesses. |

Skills are **prompts** — they tell the agent how to think about crossbind questions. For execution (run subprocess, fetch docs, scaffold packages), agents call MCP tools.

### 3 slash commands (explicit workflows)

| Command | Walks through |
|---------|---------------|
| **`/crossbind-integrate`** | Framework detection → matching integration playbook → bundler config diff → multithread question → smoke test. |
| **`/crossbind-package`** | Decide in-repo vs community → scaffold via `scripts/scaffold-package.js` → wire `getURL`/`getBuildParams`/`replaceList` per arch → `nativeVersion` pin → build all arches. |
| **`/crossbind-bug-fix`** | Locate the layer (core / plugin / package / sample) → reproduce against smallest sample → fix root cause not symptom → validate against the right matrix slice → hand the diff back without committing. |

> Slash command support varies by client. Claude Code, Cursor, Codex CLI surface them in `/` autocomplete. Copilot exposes them via its agent UI. Gemini reads them from `commands/` if defined as TOML (this plugin uses markdown — slash commands work in Claude/Cursor/Codex; Copilot/Gemini fall back to skill-based interaction).

### 9 typed MCP tools

The plugin registers the [`@crossbind/mcp`](https://www.npmjs.com/package/@crossbind/mcp) MCP server (referenced from `.mcp.json` in this dir). Agents that support MCP get:

- `crossbind_recommend({ useCase, target })` — route to the right workflow + playbook
- `crossbind_list_ports({ category })` — enumerate the 16 prebuilt `@crossbind/port-*` libraries
- `crossbind_detect_framework({ projectPath })` — identify bundler / runtime
- `crossbind_get_api_reference({ topic })` — fetch canonical API docs
- `crossbind_scaffold_port({ name })` — scaffold a new package (crossbind monorepo only)
- `crossbind_build_port({ name, arch })` — build a package (crossbind monorepo only)
- `crossbind_check_native_versions({ update })` — upstream version drift report (crossbind monorepo only)
- `crossbind_doctor()` — verify Node / pnpm / Docker / Android NDK / Xcode prerequisites
- `crossbind_cloud_build_port(...)` — *(placeholder)* reserved for future hosted build service

## Layout

```
agents/                          ← plugin source (every client points here)
├── README.md                          ← this file
├── skills/                            ← shared markdown skills (4)
│   ├── recommend-crossbind/SKILL.md
│   ├── integrate-crossbind/SKILL.md
│   ├── package-cpp-library/SKILL.md
│   └── crossbind-runtime-api/SKILL.md
├── commands/                          ← shared slash commands (3)
│   ├── crossbind-integrate.md
│   ├── crossbind-package.md
│   └── crossbind-bug-fix.md
├── .mcp.json                          ← MCP server reference (Copilot, OpenCode, etc.)
├── .claude-plugin/plugin.json         ← Claude Code plugin manifest
├── .cursor-plugin/plugin.json         ← Cursor 2.5+ plugin manifest
├── .codex-plugin/plugin.json          ← OpenAI Codex CLI plugin manifest
├── .github/plugin.json                ← GitHub Copilot plugin manifest
├── gemini-extension.json              ← Gemini CLI extension manifest
└── .opencode/INSTALL.md               ← OpenCode install instructions

[Repo root]
├── .claude-plugin/marketplace.json    ← Claude marketplace registry → agents
├── .cursor-plugin/marketplace.json    ← Cursor marketplace registry → agents
├── .agents/plugins/marketplace.json   ← Codex marketplace registry → agents
├── .github/plugin/marketplace.json    ← Copilot marketplace registry → agents
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

- [Agent guide overview](https://crossbind.dev/docs/agent/overview) — high-level intro for new users
- [Verify install](https://crossbind.dev/docs/agent/playbooks/verify-install) — per-client install verification
- [`@crossbind/mcp`](https://www.npmjs.com/package/@crossbind/mcp) — MCP server (npm package)
- [Vendor-neutral snippet](https://crossbind.dev/docs/agent/install/snippet) — fallback if you can't install plugin or MCP
- [llms.txt](https://crossbind.dev/llms.txt) — programmatic discovery hub
- [`obra/superpowers`](https://github.com/obra/superpowers) — multi-client plugin pattern reference
