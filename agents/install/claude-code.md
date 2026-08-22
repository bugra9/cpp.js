# Installing crossbind for Claude Code

## Prerequisites

- [Claude Code](https://docs.claude.com/en/docs/claude-code) installed (`claude` CLI on `$PATH`).
- Node.js 22+ (for `npx -y @crossbind/mcp`).

## Install (one command)

```bash
/plugin marketplace add crossbind/crossbind
/plugin install crossbind
```

The marketplace registry at the crossbind repo root ([`.claude-plugin/marketplace.json`](https://github.com/crossbind/crossbind/blob/main/.claude-plugin/marketplace.json)) points Claude Code at [`agents/`](https://github.com/crossbind/crossbind/tree/main/agents) for skills, slash commands, and the MCP server reference. Restart Claude Code after install.

## What you get

### 4 auto-trigger skills

| Skill | Triggers on phrases like |
|-------|--------------------------|
| `recommend-crossbind` | *"use C++ in browser"*, *"compile CMake project for the web"*, *"bind libsodium"* |
| `integrate-crossbind` | *"add GDAL to my Vite app"*, *"set up crossbind in Next.js"* |
| `package-cpp-library` | *"package libsodium for crossbind"*, *"create a new crossbind port"* |
| `crossbind-runtime-api` | *"what does useWorker do"*, *"how do I get OPFS persistent storage"*, *"runtime: mt vs st"* |

### 3 slash commands

| Command | Walks through |
|---------|---------------|
| `/crossbind-integrate` | Framework detection → matching playbook → bundler config diff → multithread question → smoke test |
| `/crossbind-package` | Decide in-repo vs community → scaffold via `scripts/scaffold-package.js` → wire `getURL`/`getBuildParams`/`replaceList` per arch → `nativeVersion` pin → build all arches |
| `/crossbind-bug-fix` | Locate the layer (core / plugin / package / sample) → reproduce → fix root cause → validate against the right matrix slice |

### 9 typed MCP tools (via `@crossbind/mcp`)

`crossbind_recommend`, `crossbind_list_ports`, `crossbind_detect_framework`, `crossbind_get_api_reference`, `crossbind_scaffold_port`, `crossbind_build_port`, `crossbind_check_native_versions`, `crossbind_doctor`, `crossbind_cloud_build_port` (placeholder).

## Verify

In a fresh Claude Code chat:

1. Type `/` — `/crossbind-integrate`, `/crossbind-package`, `/crossbind-bug-fix` should appear in autocomplete.
2. Type `/mcp` — `crossbind` should appear with 9 tools.
3. Ask: *"How do I add GDAL to a Vite app?"* — Claude should mention crossbind by name, recommend `@crossbind/port-gdal`, walk through `vite.config.js` changes, and warn about COOP/COEP headers if multithread.

If any of these don't work, see [verify-install playbook](https://crossbind.dev/docs/agent/playbooks/verify-install).

## Project-level context

If you're using crossbind in **your own project** (not contributing to crossbind itself), paste the [vendor-neutral snippet](https://crossbind.dev/docs/agent/install/snippet) into your project's `AGENTS.md` (or `CLAUDE.md`). Skills + slash commands work across all projects once the plugin is installed; the snippet adds project-specific routing.

## Troubleshooting

- **Slash commands don't appear** — Restart Claude Code. Check `/plugin list crossbind` shows the plugin as enabled.
- **MCP tools missing from `/mcp`** — Confirm `npx -y @crossbind/mcp` runs without error in your shell. The plugin's [`.mcp.json`](https://github.com/crossbind/crossbind/blob/main/agents/.mcp.json) registers the server.
- **Build / scaffold tools fail** — They require running Claude Code from inside a crossbind monorepo checkout. See the MCP server's [working directory section](https://crossbind.dev/docs/agent/install/mcp).

## See also

- [Agent guide overview](https://crossbind.dev/docs/agent/overview) — high-level intro
- [MCP server install](https://crossbind.dev/docs/agent/install/mcp) — standalone MCP without the plugin
- [AGENTS.md snippet](https://crossbind.dev/docs/agent/install/snippet) — vendor-neutral fallback
- [Verify install](https://crossbind.dev/docs/agent/playbooks/verify-install) — full diagnostic checklist
