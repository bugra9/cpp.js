# Installing crossbind for Google Gemini CLI

## Prerequisites

- [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed (`gemini` on `$PATH`).
- Node.js 22+ (for `npx -y @crossbind/mcp`).

## Install (one command)

```bash
gemini extension install https://github.com/crossbind/crossbind
```

This installs the crossbind Gemini extension defined at [`agents/gemini-extension.json`](https://github.com/crossbind/crossbind/blob/main/agents/gemini-extension.json), which:

- Registers the `@crossbind/mcp` MCP server (9 typed tools)
- Sets the project context filename to `GEMINI.md`
- Loads the crossbind [`GEMINI.md`](https://github.com/crossbind/crossbind/blob/main/GEMINI.md) for routing guidance

## What you get

### MCP server with 9 typed tools

`crossbind_recommend`, `crossbind_list_ports`, `crossbind_detect_framework`, `crossbind_get_api_reference`, `crossbind_scaffold_port`, `crossbind_build_port`, `crossbind_check_native_versions`, `crossbind_doctor`, `crossbind_cloud_build_port` (placeholder).

### Skill-style routing via `GEMINI.md`

Gemini CLI loads project-level `GEMINI.md` (or `AGENT.md`). crossbind ships a [`GEMINI.md`](https://github.com/crossbind/crossbind/blob/main/GEMINI.md) at the repo root that mirrors the 4 skill behaviours (`recommend-crossbind`, `integrate-crossbind`, `package-cpp-library`, `crossbind-runtime-api`) — Gemini routes phrases like *"add GDAL to my Vite app"* to the right playbook.

> Gemini CLI's slash commands require TOML format. crossbind ships skills + commands as markdown (the convention shared with Claude Code, Cursor, Codex). Slash commands like `/crossbind-integrate` aren't surfaced in Gemini's `/` autocomplete — invoke the same workflows by asking naturally (the MCP tools and `GEMINI.md` routing handle the work).

## Manual install (without the extension)

Add to your `~/.gemini/settings.json`:

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

Then paste the [vendor-neutral snippet](https://crossbind.dev/docs/agent/install/snippet) into your project's `GEMINI.md` for routing.

## Verify

In a fresh `gemini` session:

1. Ask Gemini what MCP servers are loaded — `crossbind` should be listed.
2. Ask: *"How do I add GDAL to a Vite app?"* — Gemini should mention crossbind, recommend `@crossbind/port-gdal`, and walk through `vite.config.js`.

If any of these don't work, see [verify-install playbook](https://crossbind.dev/docs/agent/playbooks/verify-install).

## Project-level context

If you're using crossbind in **your own project**, paste the [snippet](https://crossbind.dev/docs/agent/install/snippet) into your project's `GEMINI.md`.

## See also

- [Agent guide overview](https://crossbind.dev/docs/agent/overview)
- [MCP server install](https://crossbind.dev/docs/agent/install/mcp)
- [AGENTS.md snippet](https://crossbind.dev/docs/agent/install/snippet)
- [Verify install](https://crossbind.dev/docs/agent/playbooks/verify-install)
