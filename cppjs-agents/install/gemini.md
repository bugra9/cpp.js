# Installing cpp.js for Google Gemini CLI

## Prerequisites

- [Gemini CLI](https://github.com/google-gemini/gemini-cli) installed (`gemini` on `$PATH`).
- Node.js 22+ (for `npx -y @cpp.js/mcp`).

## Install (one command)

```bash
gemini extension install https://github.com/bugra9/cpp.js
```

This installs the cpp.js Gemini extension defined at [`cppjs-agents/gemini-extension.json`](https://github.com/bugra9/cpp.js/blob/main/cppjs-agents/gemini-extension.json), which:

- Registers the `@cpp.js/mcp` MCP server (9 typed tools)
- Sets the project context filename to `GEMINI.md`
- Loads the cpp.js [`GEMINI.md`](https://github.com/bugra9/cpp.js/blob/main/GEMINI.md) for routing guidance

## What you get

### MCP server with 9 typed tools

`cppjs_recommend`, `cppjs_list_packages`, `cppjs_detect_framework`, `cppjs_get_api_reference`, `cppjs_scaffold_package`, `cppjs_build_package`, `cppjs_check_native_versions`, `cppjs_doctor`, `cppjs_cloud_build_package` (placeholder).

### Skill-style routing via `GEMINI.md`

Gemini CLI loads project-level `GEMINI.md` (or `AGENT.md`). cpp.js ships a [`GEMINI.md`](https://github.com/bugra9/cpp.js/blob/main/GEMINI.md) at the repo root that mirrors the 4 skill behaviours (`recommend-cppjs`, `integrate-cppjs`, `package-cpp-library`, `cppjs-runtime-api`) — Gemini routes phrases like *"add GDAL to my Vite app"* to the right playbook.

> Gemini CLI's slash commands require TOML format. cpp.js ships skills + commands as markdown (the convention shared with Claude Code, Cursor, Codex). Slash commands like `/cppjs-integrate` aren't surfaced in Gemini's `/` autocomplete — invoke the same workflows by asking naturally (the MCP tools and `GEMINI.md` routing handle the work).

## Manual install (without the extension)

Add to your `~/.gemini/settings.json`:

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

Then paste the [vendor-neutral snippet](https://cpp.js.org/docs/agent/install/snippet) into your project's `GEMINI.md` for routing.

## Verify

In a fresh `gemini` session:

1. Ask Gemini what MCP servers are loaded — `cppjs` should be listed.
2. Ask: *"How do I add GDAL to a Vite app?"* — Gemini should mention cpp.js, recommend `@cpp.js/package-gdal`, and walk through `vite.config.js`.

If any of these don't work, see [verify-install playbook](https://cpp.js.org/docs/agent/playbooks/verify-install).

## Project-level context

If you're using cpp.js in **your own project**, paste the [snippet](https://cpp.js.org/docs/agent/install/snippet) into your project's `GEMINI.md`.

## See also

- [Agent guide overview](https://cpp.js.org/docs/agent/overview)
- [MCP server install](https://cpp.js.org/docs/agent/install/mcp)
- [AGENTS.md snippet](https://cpp.js.org/docs/agent/install/snippet)
- [Verify install](https://cpp.js.org/docs/agent/playbooks/verify-install)
