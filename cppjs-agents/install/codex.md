# Installing cpp.js for OpenAI Codex CLI

## Prerequisites

- [OpenAI Codex CLI](https://github.com/openai/codex) installed (`codex` on `$PATH`).
- Node.js 22+ (for `npx -y @cpp.js/mcp`).

## Install

Add `bugra9/cpp.js` to your global Codex marketplace registry, then install:

```bash
# Edit ~/.agents/plugins/marketplace.json — append:
#   { "name": "cppjs", "source": "github:bugra9/cpp.js" }
codex plugin install cppjs
```

The marketplace registry at the cpp.js repo root ([`.agents/plugins/marketplace.json`](https://github.com/bugra9/cpp.js/blob/main/.agents/plugins/marketplace.json)) points Codex at [`cppjs-agents/`](https://github.com/bugra9/cpp.js/tree/main/cppjs-agents) for skills, commands, and the MCP server reference. Restart Codex after install.

## What you get

### 4 auto-trigger skills

`recommend-cppjs`, `integrate-cppjs`, `package-cpp-library`, `cppjs-runtime-api`. Codex reads them from `cppjs-agents/skills/` per the plugin's [`.codex-plugin/plugin.json`](https://github.com/bugra9/cpp.js/blob/main/cppjs-agents/.codex-plugin/plugin.json) `interface` block.

### 3 slash commands

`/cppjs-integrate`, `/cppjs-package`, `/cppjs-bug-fix`. Available in Codex CLI's `/` autocomplete.

### 9 typed MCP tools (via `@cpp.js/mcp`)

`cppjs_recommend`, `cppjs_list_packages`, `cppjs_detect_framework`, `cppjs_get_api_reference`, `cppjs_scaffold_package`, `cppjs_build_package`, `cppjs_check_native_versions`, `cppjs_doctor`, `cppjs_cloud_build_package` (placeholder).

## Verify

In a fresh `codex` session:

1. Type `/` — slash commands should autocomplete.
2. Run `codex mcp list` — `cppjs` should appear.
3. Ask: *"How do I add SQLite to a Cloudflare Worker?"* — Codex should mention cpp.js, recommend `@cpp.js/package-sqlite3`, and warn about edge-runtime threading limits.

If any of these don't work, see [verify-install playbook](https://cpp.js.org/docs/agent/playbooks/verify-install).

## Manual MCP-only install (without the plugin)

Add to `~/.codex/config.toml` (or per-project `.codex/config.toml`):

```toml
[mcp_servers.cppjs]
command = "npx"
args = ["-y", "@cpp.js/mcp"]
```

Or via the CLI:

```bash
codex mcp add cppjs --command "npx -y @cpp.js/mcp"
```

This gives you the 9 typed tools without skills or slash commands.

## Project-level context

If you're using cpp.js in **your own project**, paste the [snippet](https://cpp.js.org/docs/agent/install/snippet) into your project's `AGENTS.md` — Codex CLI reads `AGENTS.md` at the project root.

## See also

- [Agent guide overview](https://cpp.js.org/docs/agent/overview)
- [MCP server install](https://cpp.js.org/docs/agent/install/mcp)
- [AGENTS.md snippet](https://cpp.js.org/docs/agent/install/snippet)
- [Verify install](https://cpp.js.org/docs/agent/playbooks/verify-install)
