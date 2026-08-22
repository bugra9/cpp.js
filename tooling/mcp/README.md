# @crossbind/mcp

**Model Context Protocol** server for [crossbind](https://crossbind.dev). Gives any MCP-compatible coding agent (Claude Desktop, Claude Code, Cursor, Codex, Cline, …) typed access to the crossbind toolchain — recommend the right workflow, detect a project's bundler, list prebuilt packages, scaffold new ones, and run builds.

> Not Claude-specific. MCP is a vendor-neutral standard; this server speaks JSON-RPC over stdio and works with every client that supports MCP.

## Install

The server is published to npm and runs via `npx`. No global install needed.

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

### Claude Code

```bash
claude mcp add crossbind -- npx -y @crossbind/mcp
```

### Cursor

Settings → MCP → Add new MCP server. Paste:

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

### OpenAI Codex CLI

Add to `~/.codex/config.toml` (or per-project `.codex/config.toml`):

```toml
[mcp_servers.crossbind]
command = "npx"
args = ["-y", "@crossbind/mcp"]
```

Or via Codex CLI:

```bash
codex mcp add crossbind --command "npx -y @crossbind/mcp"
```

### GitHub Copilot CLI

Copilot CLI auto-discovers MCP servers from the active plugin's `.mcp.json`. The crossbind Copilot plugin (`agents/.github/plugin.json`) references [`agents/.mcp.json`](https://github.com/crossbind/crossbind/blob/main/agents/.mcp.json), which registers `crossbind` automatically when the plugin is installed.

Manual install (without the plugin):

```bash
copilot mcp add crossbind npx -y @crossbind/mcp
```

### Google Gemini CLI

Either install the [crossbind Gemini extension](https://github.com/crossbind/crossbind/blob/main/agents/gemini-extension.json) (which wires this MCP server automatically):

```bash
gemini extension install https://github.com/crossbind/crossbind
```

Or add manually to your `~/.gemini/settings.json`:

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

### OpenCode

Add to `opencode.json` (global at `~/.config/opencode/opencode.json` or project-level):

```jsonc
{
    "mcp": {
        "crossbind": {
            "type": "local",
            "command": ["npx", "-y", "@crossbind/mcp"],
            "enabled": true
        }
    }
}
```

### Cline / other MCP clients

Use the same JSON shape. The command is always `npx -y @crossbind/mcp`; transport is stdio.

### Working directory

For the **build / scaffold / check / doctor** tools, the server must be launched from inside a crossbind monorepo checkout (it walks up looking for `pnpm-workspace.yaml` + `core/` + `ports/`). The **detect_framework / list_packages / recommend** tools work anywhere — they don't need the monorepo.

To pin the working directory, override `cwd` in your MCP client config (most clients support it), or wrap the command:

```json
{
    "mcpServers": {
        "crossbind": {
            "command": "npx",
            "args": ["-y", "@crossbind/mcp"],
            "cwd": "/path/to/your/crossbind/checkout"
        }
    }
}
```

## Tools

| Tool | Needs monorepo? | What it does |
|------|------------------|--------------|
| `crossbind_recommend` | no | Given a use-case description, route to integrate / package / inline workflow + the right playbook. |
| `crossbind_list_ports` | no | Catalog of 16 prebuilt `@crossbind/port-*` libraries (gdal, openssl, geos, sqlite3, …). Filter by category. |
| `crossbind_detect_framework` | no | Detect bundler / runtime of a project (vite, webpack, rspack, rollup, nextjs, RN-cli, RN-expo, cloudflare-worker, nodejs, vanilla). |
| `crossbind_scaffold_port` | yes | Create a new `ports/<name>` family from the zlib template. |
| `crossbind_doctor` | yes | Verify Node / pnpm / Docker / Android SDK+NDK / Xcode prerequisites. |
| `crossbind_build_port` | yes | Run `pnpm --filter '@crossbind/port-<name>*' run build` for the requested arches. |
| `crossbind_check_native_versions` | yes | Compare each package's `nativeVersion` against the latest upstream release; optionally auto-bump. |
| `crossbind_cloud_build_port` | no | Placeholder for a future hosted build service. Returns "not implemented" + local-build alternatives. |

## Pairs with the Claude Code plugin

The `crossbind` Claude Code plugin (in this same repo under `agents/`) ships the same workflows as **slash commands** (`/crossbind-integrate`, `/crossbind-package`, `/crossbind-bug-fix`) and **skills** that auto-trigger on user phrases. Skills tell the agent *how to think*; this MCP gives it *function calls*. Use both together for the best experience.

## Reference

- crossbind homepage: https://crossbind.dev
- Agents landing: https://crossbind.dev/docs/agent/overview
- Source: https://github.com/crossbind/crossbind/tree/main/tooling/mcp
- License: MIT
