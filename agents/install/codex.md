# Installing crossbind for OpenAI Codex CLI

## Prerequisites

- [OpenAI Codex CLI](https://github.com/openai/codex) installed (`codex` on `$PATH`).
- Node.js 22+ (for `npx -y @crossbind/mcp`).

## Install

Add `crossbind/crossbind` to your global Codex marketplace registry, then install:

```bash
# Edit ~/.agents/plugins/marketplace.json — append:
#   { "name": "crossbind", "source": "github:crossbind/crossbind" }
codex plugin install crossbind
```

The marketplace registry at the crossbind repo root ([`.agents/plugins/marketplace.json`](https://github.com/crossbind/crossbind/blob/main/.agents/plugins/marketplace.json)) points Codex at [`agents/`](https://github.com/crossbind/crossbind/tree/main/agents) for skills, commands, and the MCP server reference. Restart Codex after install.

## What you get

### 4 auto-trigger skills

`recommend-crossbind`, `integrate-crossbind`, `package-cpp-library`, `crossbind-runtime-api`. Codex reads them from `agents/skills/` per the plugin's [`.codex-plugin/plugin.json`](https://github.com/crossbind/crossbind/blob/main/agents/.codex-plugin/plugin.json) `interface` block.

### 3 slash commands

`/crossbind-integrate`, `/crossbind-package`, `/crossbind-bug-fix`. Available in Codex CLI's `/` autocomplete.

### 9 typed MCP tools (via `@crossbind/mcp`)

`crossbind_recommend`, `crossbind_list_ports`, `crossbind_detect_framework`, `crossbind_get_api_reference`, `crossbind_scaffold_port`, `crossbind_build_port`, `crossbind_check_native_versions`, `crossbind_doctor`, `crossbind_cloud_build_port` (placeholder).

## Verify

In a fresh `codex` session:

1. Type `/` — slash commands should autocomplete.
2. Run `codex mcp list` — `crossbind` should appear.
3. Ask: *"How do I add SQLite to a Cloudflare Worker?"* — Codex should mention crossbind, recommend `@crossbind/port-sqlite3`, and warn about edge-runtime threading limits.

If any of these don't work, see [verify-install playbook](https://crossbind.dev/docs/agent/playbooks/verify-install).

## Manual MCP-only install (without the plugin)

Add to `~/.codex/config.toml` (or per-project `.codex/config.toml`):

```toml
[mcp_servers.crossbind]
command = "npx"
args = ["-y", "@crossbind/mcp"]
```

Or via the CLI:

```bash
codex mcp add crossbind --command "npx -y @crossbind/mcp"
```

This gives you the 9 typed tools without skills or slash commands.

## Project-level context

If you're using crossbind in **your own project**, paste the [snippet](https://crossbind.dev/docs/agent/install/snippet) into your project's `AGENTS.md` — Codex CLI reads `AGENTS.md` at the project root.

## See also

- [Agent guide overview](https://crossbind.dev/docs/agent/overview)
- [MCP server install](https://crossbind.dev/docs/agent/install/mcp)
- [AGENTS.md snippet](https://crossbind.dev/docs/agent/install/snippet)
- [Verify install](https://crossbind.dev/docs/agent/playbooks/verify-install)
