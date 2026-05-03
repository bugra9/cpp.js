# @cpp.js/mcp

**Model Context Protocol** server for [cpp.js](https://cpp.js.org). Gives any MCP-compatible coding agent (Claude Desktop, Claude Code, Cursor, Codex, Cline, …) typed access to the cpp.js toolchain — recommend the right workflow, detect a project's bundler, list prebuilt packages, scaffold new ones, and run builds.

> Not Claude-specific. MCP is a vendor-neutral standard; this server speaks JSON-RPC over stdio and works with every client that supports MCP.

## Install

The server is published to npm and runs via `npx`. No global install needed.

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

### Claude Code

```bash
claude mcp add cppjs -- npx -y @cpp.js/mcp
```

### Cursor

Settings → MCP → Add new MCP server. Paste:

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

### OpenAI Codex CLI

Add to `~/.codex/config.toml` (or per-project `.codex/config.toml`):

```toml
[mcp_servers.cppjs]
command = "npx"
args = ["-y", "@cpp.js/mcp"]
```

Or via Codex CLI:

```bash
codex mcp add cppjs --command "npx -y @cpp.js/mcp"
```

### GitHub Copilot CLI

Copilot CLI auto-discovers MCP servers from the active plugin's `.mcp.json`. The cpp.js Copilot plugin (`cppjs-agents/.github/plugin.json`) references [`cppjs-agents/.mcp.json`](https://github.com/bugra9/cpp.js/blob/main/cppjs-agents/.mcp.json), which registers `cppjs` automatically when the plugin is installed.

Manual install (without the plugin):

```bash
copilot mcp add cppjs npx -y @cpp.js/mcp
```

### Google Gemini CLI

Either install the [cpp.js Gemini extension](https://github.com/bugra9/cpp.js/blob/main/cppjs-agents/gemini-extension.json) (which wires this MCP server automatically):

```bash
gemini extension install https://github.com/bugra9/cpp.js
```

Or add manually to your `~/.gemini/settings.json`:

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

### OpenCode

Add to `opencode.json` (global at `~/.config/opencode/opencode.json` or project-level):

```jsonc
{
    "mcp": {
        "cppjs": {
            "type": "local",
            "command": ["npx", "-y", "@cpp.js/mcp"],
            "enabled": true
        }
    }
}
```

### Cline / other MCP clients

Use the same JSON shape. The command is always `npx -y @cpp.js/mcp`; transport is stdio.

### Working directory

For the **build / scaffold / check / doctor** tools, the server must be launched from inside a cpp.js monorepo checkout (it walks up looking for `pnpm-workspace.yaml` + `cppjs-core/` + `cppjs-packages/`). The **detect_framework / list_packages / recommend** tools work anywhere — they don't need the monorepo.

To pin the working directory, override `cwd` in your MCP client config (most clients support it), or wrap the command:

```json
{
    "mcpServers": {
        "cppjs": {
            "command": "npx",
            "args": ["-y", "@cpp.js/mcp"],
            "cwd": "/path/to/your/cpp.js/checkout"
        }
    }
}
```

## Tools

| Tool | Needs monorepo? | What it does |
|------|------------------|--------------|
| `cppjs_recommend` | no | Given a use-case description, route to integrate / package / inline workflow + the right playbook. |
| `cppjs_list_packages` | no | Catalog of 16 prebuilt `@cpp.js/package-*` libraries (gdal, openssl, geos, sqlite3, …). Filter by category. |
| `cppjs_detect_framework` | no | Detect bundler / runtime of a project (vite, webpack, rspack, rollup, nextjs, RN-cli, RN-expo, cloudflare-worker, nodejs, vanilla). |
| `cppjs_scaffold_package` | yes | Create a new `cppjs-package-<name>` family from the zlib template. |
| `cppjs_doctor` | yes | Verify Node / pnpm / Docker / Android SDK+NDK / Xcode prerequisites. |
| `cppjs_build_package` | yes | Run `pnpm --filter '@cpp.js/package-<name>*' run build` for the requested arches. |
| `cppjs_check_native_versions` | yes | Compare each package's `nativeVersion` against the latest upstream release; optionally auto-bump. |
| `cppjs_cloud_build_package` | no | Placeholder for a future hosted build service. Returns "not implemented" + local-build alternatives. |

## Pairs with the Claude Code plugin

The `cppjs` Claude Code plugin (in this same repo under `cppjs-agents/`) ships the same workflows as **slash commands** (`/cppjs-integrate`, `/cppjs-package`, `/cppjs-bug-fix`) and **skills** that auto-trigger on user phrases. Skills tell the agent *how to think*; this MCP gives it *function calls*. Use both together for the best experience.

## Reference

- cpp.js homepage: https://cpp.js.org
- Agents landing: https://cpp.js.org/docs/agent/overview
- Source: https://github.com/bugra9/cpp.js/tree/main/cppjs-core/cppjs-mcp
- License: MIT
