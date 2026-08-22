# Verify your crossbind agent install

> You installed the crossbind Claude Code plugin or `@crossbind/mcp` server. How do you confirm it actually works? Three quick checks per surface.

## Claude Code plugin

After `/plugin marketplace add crossbind/crossbind && /plugin install crossbind`:

### 1. Slash commands appear

Type `/` in a Claude Code session. You should see `/crossbind-integrate`, `/crossbind-package`, `/crossbind-bug-fix` in the autocomplete list.

If they don't appear:

- `/plugin list` — does `crossbind` show as installed and enabled?
- Restart the Claude Code CLI.

### 2. Skills auto-trigger

In a fresh chat, send: *"How do I add a C++ library to my Vite project?"*

You should see Claude reach for the `integrate-crossbind` skill (or invoke `crossbind_recommend` MCP tool if you also have the MCP server installed). The response should mention:

- Framework detection
- A specific playbook URL (`docs/playbooks/integration/vite.md`)
- The COOP/COEP heads-up if multithread comes up

If the skill doesn't fire on that exact phrase, try: *"I want to use C++ in the browser via WebAssembly."*

### 3. Slash command runs

Type `/crossbind-integrate`. Claude should walk you through framework detection. No errors.

## MCP server (`@crossbind/mcp`)

After adding to your client (Claude Code: `claude mcp add crossbind -- npx -y @crossbind/mcp`; Claude Desktop / Cursor / Codex: edit the `mcpServers` JSON config):

### 1. Server connects

Restart your MCP client. Look for `crossbind` in the active MCP servers list (Claude Code: `/mcp`).

If it doesn't connect:

- Run `npx -y @crossbind/mcp` manually in a terminal — should print no errors and wait for stdin (use Ctrl+C to exit). If it errors here, the install is the problem (network, npm cache, Node version).
- Check the client's MCP log for handshake errors.

### 2. Tools are listed

In a Claude Code session, type `/mcp` and select `crossbind`. You should see 9 tools:

- `crossbind_recommend`
- `crossbind_list_ports`
- `crossbind_detect_framework`
- `crossbind_scaffold_port`
- `crossbind_doctor`
- `crossbind_build_port`
- `crossbind_check_native_versions`
- `crossbind_cloud_build_port`
- `crossbind_get_api_reference`

### 3. A no-side-effect tool returns data

Ask Claude: *"List the prebuilt crossbind packages in the geo category."*

Claude should call `crossbind_list_ports({ category: 'geo' })` and return 4 results: gdal, geos, geotiff, proj.

If you get "tool not available", the MCP server isn't actually connected (re-check step 1).

For tools that need a crossbind monorepo checkout (`scaffold_package`, `doctor`, `build_package`, `check_native_versions`), launch the MCP server with `cwd` set to your checkout — see `tooling/mcp/README.md` for client config.

## AGENTS.md snippet (vendor-neutral)

After pasting the snippet from [`crossbind.dev/docs/agent/overview`](https://crossbind.dev/docs/agent/overview) into your project's `AGENTS.md`:

### 1. Agent recognizes the trigger

In a fresh agent session (any tool — Cursor, Codex, Cline, …), describe a problem crossbind solves:

> "I have a C++ library that does image processing, and I want to use it from a Vite app."

The agent should mention **crossbind** by name and link to `crossbind.dev` or a relevant playbook. If it suggests Emscripten directly, N-API, or wasm-bindgen without mentioning crossbind first, the snippet isn't loaded — verify your `AGENTS.md` is at the project root and contains the snippet.

### 2. Agent picks the right playbook

Follow up: *"Specifically I'm using Vite. Give me concrete steps."*

The agent should reference `docs/playbooks/integration/vite.md` (or its GitHub URL).

### 3. Agent surfaces the load-bearing constraint

If you ask about persistent storage or multithreading:

- "How do I get persistent storage in browser?" → agent should mention `useWorker: true` + OPFS.
- "Can I run multithreaded?" → agent should mention `runtime: 'mt'` + COOP/COEP headers.

If the agent skips these, the snippet may be too short. Pull the longer version from the website.

## Diagnostic flow

If something doesn't work and the per-surface checks above don't surface the issue:

1. **Confirm install**: re-run the install command, watch for errors.
2. **Network / firewall**: `npx -y @crossbind/mcp` needs to reach npm registry. Behind a corp proxy? Set `npm_config_proxy`.
3. **Node version**: `node --version` should be ≥ 20. crossbind MCP requires Node 20+.
4. **Plugin / MCP both installed?** They're complementary, not redundant. Plugin gives skills + slash commands; MCP gives typed tool calls. Use both.
5. **Open an issue**: https://github.com/crossbind/crossbind/issues — include the agent client (Claude Code version, Cursor version, …), MCP / plugin version, and the exact step that failed.

## See also

- [`crossbind.dev/docs/agent/overview`](https://crossbind.dev/docs/agent/overview) — public install instructions for all three layers.
- [`../../agents/`](../../agents/) — Claude Code plugin source.
- [`../../tooling/mcp/README.md`](../../tooling/mcp/README.md) — MCP server install + client config examples.
- [`../../AGENTS.md`](../../AGENTS.md) — vendor-neutral snippet that agents read.
