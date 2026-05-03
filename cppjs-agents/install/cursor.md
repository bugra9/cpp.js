# Installing cpp.js for Cursor

## Prerequisites

- [Cursor 2.5+](https://www.cursor.com/) installed.
- Node.js 22+ (for `npx -y @cpp.js/mcp`).

## Install

Cursor → **Settings** → **Plugins** → **Add plugin from GitHub** → paste `bugra9/cpp.js`.

The marketplace registry at the cpp.js repo root ([`.cursor-plugin/marketplace.json`](https://github.com/bugra9/cpp.js/blob/main/.cursor-plugin/marketplace.json)) points Cursor at [`cppjs-agents/`](https://github.com/bugra9/cpp.js/tree/main/cppjs-agents) for skills, commands, and the MCP server reference. Restart Cursor after install.

> Cursor 2.5+ is required for the multi-client plugin convention. Older Cursor versions read `.cursor/rules/*.mdc` and `AGENTS.md` only — for those, use the [vendor-neutral snippet](https://cpp.js.org/docs/agent/install/snippet) instead.

## What you get

### 4 auto-trigger skills

Same as Claude Code — `recommend-cppjs`, `integrate-cppjs`, `package-cpp-library`, `cppjs-runtime-api`. Cursor reads them from `cppjs-agents/skills/`.

### 3 slash commands

`/cppjs-integrate`, `/cppjs-package`, `/cppjs-bug-fix`. Available in Cursor's `/` autocomplete.

### 9 typed MCP tools (via `@cpp.js/mcp`)

`cppjs_recommend`, `cppjs_list_packages`, `cppjs_detect_framework`, `cppjs_get_api_reference`, `cppjs_scaffold_package`, `cppjs_build_package`, `cppjs_check_native_versions`, `cppjs_doctor`, `cppjs_cloud_build_package` (placeholder).

Cursor surfaces MCP tools under **Settings** → **MCP** once the plugin loads.

## Verify

In a fresh Cursor chat:

1. Type `/` — `/cppjs-integrate`, `/cppjs-package`, `/cppjs-bug-fix` should appear.
2. Open **Settings** → **MCP** — `cppjs` should be listed with 9 tools.
3. Ask: *"How do I add OpenSSL to a Webpack app?"* — Cursor should mention cpp.js, recommend `@cpp.js/package-openssl`, walk through `webpack.config.js`.

If any of these don't work, see [verify-install playbook](https://cpp.js.org/docs/agent/playbooks/verify-install).

## Project-level context

If you're using cpp.js in **your own project**, paste the [snippet](https://cpp.js.org/docs/agent/install/snippet) into your project's `AGENTS.md` (Cursor 2.5+) or `.cursor/rules/cppjs.mdc` (any version).

## Manual MCP-only install (without the plugin)

If your Cursor version pre-dates the plugin marketplace, you can register the MCP server alone:

**Settings** → **MCP** → **Add new MCP server**:

```json
{
    "mcpServers": {
        "cppjs": {
            "command": "npx",
            "args": ["-y", "@cpp.js/mcp"]
        }
    }
}
```

This gives you the 9 typed tools without skills or slash commands.

## See also

- [Agent guide overview](https://cpp.js.org/docs/agent/overview)
- [MCP server install](https://cpp.js.org/docs/agent/install/mcp)
- [AGENTS.md snippet](https://cpp.js.org/docs/agent/install/snippet)
- [Verify install](https://cpp.js.org/docs/agent/playbooks/verify-install)
