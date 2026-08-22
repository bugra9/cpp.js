# Installing crossbind skills via the `skills` CLI

> Universal install path. Works with **50+ AI coding agents** — Cline, Continue, Windsurf, Warp, Aider, Goose, Roo, Kilo, Devin, Tabnine, Replit, and many more — without per-client plugin manifests.

## When to pick this

Choose the [`skills` CLI](https://github.com/vercel-labs/skills) over the native plugin or MCP when:

- **Your client doesn't have a native crossbind plugin** (Cline, Continue, Windsurf, Warp, …).
- **You want one install command** that works across every agent on your machine.
- **You're managing many skills** from many sources — the CLI manages updates, removal, and listing in one place.

The trade-off vs. the native plugins: skills CLI ships **only the skills**, not the slash commands or MCP tools. For Claude Code, Cursor, OpenAI Codex CLI, GitHub Copilot CLI, Google Gemini CLI, OpenCode, prefer the [native plugin](https://crossbind.dev/docs/agent/install/overview) — you get skills + slash commands + 9 typed MCP tools. Use this CLI for everything else.

## Prerequisites

- Node.js 22+ (`npx` available).
- One of the [50+ supported agents](https://github.com/vercel-labs/skills#supported-agents) installed.

## Install (one command)

```bash
npx skills add https://github.com/crossbind/crossbind/tree/main/agents/skills --global --yes
```

This installs all 4 crossbind skills (`recommend-crossbind`, `integrate-crossbind`, `package-cpp-library`, `crossbind-runtime-api`) globally for every supported agent installed on your machine.

### Install for specific agents only

```bash
# Just Cline
npx skills add https://github.com/crossbind/crossbind/tree/main/agents/skills -a cline -g -y

# Cline + Continue + Windsurf
npx skills add https://github.com/crossbind/crossbind/tree/main/agents/skills -a cline -a continue -a windsurf -g -y
```

### Install only one skill

```bash
npx skills add https://github.com/crossbind/crossbind/tree/main/agents/skills --skill crossbind-runtime-api -g -y
```

### Install per-project (committed with your repo)

Drop the `--global` flag and run from your project root:

```bash
cd /path/to/your-project
npx skills add https://github.com/crossbind/crossbind/tree/main/agents/skills --yes
```

The CLI symlinks (or copies, if symlinks aren't supported) the skills into each agent's expected directory.

## What you get

The 4 crossbind skills auto-trigger on user phrases:

| Skill | Triggers on phrases like |
|-------|--------------------------|
| `recommend-crossbind` | *"use C++ in browser"*, *"compile CMake project for the web"*, *"bind libsodium"* |
| `integrate-crossbind` | *"add GDAL to my Vite app"*, *"set up crossbind in Next.js"* |
| `package-cpp-library` | *"package libsodium for crossbind"*, *"create a new crossbind port"* |
| `crossbind-runtime-api` | *"what does useWorker do"*, *"how do I get OPFS persistent storage"* |

> **No MCP tools or slash commands.** The skills CLI is markdown-only. For typed function calls (`crossbind_build_port`, `crossbind_detect_framework`, …), install the [@crossbind/mcp server](https://crossbind.dev/docs/agent/install/mcp) alongside.

## Verify

```bash
npx skills list
```

Should show the 4 crossbind skills installed for each supported agent. Then ask your agent: *"How do I add GDAL to a Vite app?"* — it should mention crossbind by name and walk through `vite.config.js` changes.

If the skills don't trigger, see [verify-install playbook](https://crossbind.dev/docs/agent/playbooks/verify-install).

## Other commands

```bash
npx skills update     # Update installed skills to latest versions
npx skills remove     # Remove specific skills
npx skills find cpp   # Search for skills by keyword
```

## Pair with the MCP server

For typed tool calls on top of skill-based routing, also install the MCP server:

```bash
# The exact incantation depends on your agent — see the per-client MCP docs
npx -y @crossbind/mcp
```

See the [MCP server install docs](https://crossbind.dev/docs/agent/install/mcp) for the per-client config snippet.

## See also

- [Agent guide overview](https://crossbind.dev/docs/agent/overview)
- [Install — pick your client](https://crossbind.dev/docs/agent/install/overview) — native plugins for 6 clients
- [MCP server install](https://crossbind.dev/docs/agent/install/mcp)
- [AGENTS.md snippet](https://crossbind.dev/docs/agent/install/snippet)
- [`vercel-labs/skills`](https://github.com/vercel-labs/skills) — CLI source + supported agents list
