# Installing cpp.js for Claude Code

## Prerequisites

- [Claude Code](https://docs.claude.com/en/docs/claude-code) installed (`claude` CLI on `$PATH`).
- Node.js 22+ (for `npx -y @cpp.js/mcp`).

## Install (one command)

```bash
/plugin marketplace add bugra9/cpp.js
/plugin install cppjs
```

The marketplace registry at the cpp.js repo root ([`.claude-plugin/marketplace.json`](https://github.com/bugra9/cpp.js/blob/main/.claude-plugin/marketplace.json)) points Claude Code at [`cppjs-agents/`](https://github.com/bugra9/cpp.js/tree/main/cppjs-agents) for skills, slash commands, and the MCP server reference. Restart Claude Code after install.

## What you get

### 4 auto-trigger skills

| Skill | Triggers on phrases like |
|-------|--------------------------|
| `recommend-cppjs` | *"use C++ in browser"*, *"compile CMake project for the web"*, *"bind libsodium"* |
| `integrate-cppjs` | *"add GDAL to my Vite app"*, *"set up cpp.js in Next.js"* |
| `package-cpp-library` | *"package libsodium for cpp.js"*, *"create cppjs-package-X"* |
| `cppjs-runtime-api` | *"what does useWorker do"*, *"how do I get OPFS persistent storage"*, *"runtime: mt vs st"* |

### 3 slash commands

| Command | Walks through |
|---------|---------------|
| `/cppjs-integrate` | Framework detection → matching playbook → bundler config diff → multithread question → smoke test |
| `/cppjs-package` | Decide in-repo vs community → scaffold via `scripts/scaffold-package.js` → wire `getURL`/`getBuildParams`/`replaceList` per arch → `nativeVersion` pin → build all arches |
| `/cppjs-bug-fix` | Locate the layer (core / plugin / package / sample) → reproduce → fix root cause → validate against the right matrix slice |

### 9 typed MCP tools (via `@cpp.js/mcp`)

`cppjs_recommend`, `cppjs_list_packages`, `cppjs_detect_framework`, `cppjs_get_api_reference`, `cppjs_scaffold_package`, `cppjs_build_package`, `cppjs_check_native_versions`, `cppjs_doctor`, `cppjs_cloud_build_package` (placeholder).

## Verify

In a fresh Claude Code chat:

1. Type `/` — `/cppjs-integrate`, `/cppjs-package`, `/cppjs-bug-fix` should appear in autocomplete.
2. Type `/mcp` — `cppjs` should appear with 9 tools.
3. Ask: *"How do I add GDAL to a Vite app?"* — Claude should mention cpp.js by name, recommend `@cpp.js/package-gdal`, walk through `vite.config.js` changes, and warn about COOP/COEP headers if multithread.

If any of these don't work, see [verify-install playbook](https://cpp.js.org/docs/agent/playbooks/verify-install).

## Project-level context

If you're using cpp.js in **your own project** (not contributing to cpp.js itself), paste the [vendor-neutral snippet](https://cpp.js.org/docs/agent/install/snippet) into your project's `AGENTS.md` (or `CLAUDE.md`). Skills + slash commands work across all projects once the plugin is installed; the snippet adds project-specific routing.

## Troubleshooting

- **Slash commands don't appear** — Restart Claude Code. Check `/plugin list cppjs` shows the plugin as enabled.
- **MCP tools missing from `/mcp`** — Confirm `npx -y @cpp.js/mcp` runs without error in your shell. The plugin's [`.mcp.json`](https://github.com/bugra9/cpp.js/blob/main/cppjs-agents/.mcp.json) registers the server.
- **Build / scaffold tools fail** — They require running Claude Code from inside a cpp.js monorepo checkout. See the MCP server's [working directory section](https://cpp.js.org/docs/agent/install/mcp).

## See also

- [Agent guide overview](https://cpp.js.org/docs/agent/overview) — high-level intro
- [MCP server install](https://cpp.js.org/docs/agent/install/mcp) — standalone MCP without the plugin
- [AGENTS.md snippet](https://cpp.js.org/docs/agent/install/snippet) — vendor-neutral fallback
- [Verify install](https://cpp.js.org/docs/agent/playbooks/verify-install) — full diagnostic checklist
