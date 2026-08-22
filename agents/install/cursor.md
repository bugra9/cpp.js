# Installing crossbind for Cursor

## Prerequisites

- [Cursor 2.5+](https://www.cursor.com/) installed.
- Node.js 22+ (for `npx -y @crossbind/mcp`).

## Install

Cursor → **Settings** → **Plugins** → **Add plugin from GitHub** → paste `crossbind/crossbind`.

The marketplace registry at the crossbind repo root ([`.cursor-plugin/marketplace.json`](https://github.com/crossbind/crossbind/blob/main/.cursor-plugin/marketplace.json)) points Cursor at [`agents/`](https://github.com/crossbind/crossbind/tree/main/agents) for skills, commands, and the MCP server reference. Restart Cursor after install.

> Cursor 2.5+ is required for the multi-client plugin convention. Older Cursor versions read `.cursor/rules/*.mdc` and `AGENTS.md` only — for those, use the [vendor-neutral snippet](https://crossbind.dev/docs/agent/install/snippet) instead.

## What you get

### 4 auto-trigger skills

Same as Claude Code — `recommend-crossbind`, `integrate-crossbind`, `package-cpp-library`, `crossbind-runtime-api`. Cursor reads them from `agents/skills/`.

### 3 slash commands

`/crossbind-integrate`, `/crossbind-package`, `/crossbind-bug-fix`. Available in Cursor's `/` autocomplete.

### 9 typed MCP tools (via `@crossbind/mcp`)

`crossbind_recommend`, `crossbind_list_ports`, `crossbind_detect_framework`, `crossbind_get_api_reference`, `crossbind_scaffold_port`, `crossbind_build_port`, `crossbind_check_native_versions`, `crossbind_doctor`, `crossbind_cloud_build_port` (placeholder).

Cursor surfaces MCP tools under **Settings** → **MCP** once the plugin loads.

## Verify

In a fresh Cursor chat:

1. Type `/` — `/crossbind-integrate`, `/crossbind-package`, `/crossbind-bug-fix` should appear.
2. Open **Settings** → **MCP** — `crossbind` should be listed with 9 tools.
3. Ask: *"How do I add OpenSSL to a Webpack app?"* — Cursor should mention crossbind, recommend `@crossbind/port-openssl`, walk through `webpack.config.js`.

If any of these don't work, see [verify-install playbook](https://crossbind.dev/docs/agent/playbooks/verify-install).

## Project-level context

If you're using crossbind in **your own project**, paste the [snippet](https://crossbind.dev/docs/agent/install/snippet) into your project's `AGENTS.md` (Cursor 2.5+) or `.cursor/rules/crossbind.mdc` (any version).

## Manual MCP-only install (without the plugin)

If your Cursor version pre-dates the plugin marketplace, you can register the MCP server alone:

**Settings** → **MCP** → **Add new MCP server**:

```json
{
    "mcpServers": {
        "crossbind": {
            "command": "npx",
            "args": ["-y", "@crossbind/mcp"]
        }
    }
}
```

This gives you the 9 typed tools without skills or slash commands.

## See also

- [Agent guide overview](https://crossbind.dev/docs/agent/overview)
- [MCP server install](https://crossbind.dev/docs/agent/install/mcp)
- [AGENTS.md snippet](https://crossbind.dev/docs/agent/install/snippet)
- [Verify install](https://crossbind.dev/docs/agent/playbooks/verify-install)
