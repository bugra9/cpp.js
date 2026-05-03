# Verify your cpp.js agent install

> You installed the cpp.js Claude Code plugin or `@cpp.js/mcp` server. How do you confirm it actually works? Three quick checks per surface.

## Claude Code plugin

After `/plugin marketplace add bugra9/cpp.js && /plugin install cppjs`:

### 1. Slash commands appear

Type `/` in a Claude Code session. You should see `/cppjs-integrate`, `/cppjs-package`, `/cppjs-bug-fix` in the autocomplete list.

If they don't appear:

- `/plugin list` — does `cppjs` show as installed and enabled?
- Restart the Claude Code CLI.

### 2. Skills auto-trigger

In a fresh chat, send: *"How do I add a C++ library to my Vite project?"*

You should see Claude reach for the `integrate-cppjs` skill (or invoke `cppjs_recommend` MCP tool if you also have the MCP server installed). The response should mention:

- Framework detection
- A specific playbook URL (`docs/playbooks/integration/vite.md`)
- The COOP/COEP heads-up if multithread comes up

If the skill doesn't fire on that exact phrase, try: *"I want to use C++ in the browser via WebAssembly."*

### 3. Slash command runs

Type `/cppjs-integrate`. Claude should walk you through framework detection. No errors.

## MCP server (`@cpp.js/mcp`)

After adding to your client (Claude Code: `claude mcp add cppjs -- npx -y @cpp.js/mcp`; Claude Desktop / Cursor / Codex: edit the `mcpServers` JSON config):

### 1. Server connects

Restart your MCP client. Look for `cppjs` in the active MCP servers list (Claude Code: `/mcp`).

If it doesn't connect:

- Run `npx -y @cpp.js/mcp` manually in a terminal — should print no errors and wait for stdin (use Ctrl+C to exit). If it errors here, the install is the problem (network, npm cache, Node version).
- Check the client's MCP log for handshake errors.

### 2. Tools are listed

In a Claude Code session, type `/mcp` and select `cppjs`. You should see 9 tools:

- `cppjs_recommend`
- `cppjs_list_packages`
- `cppjs_detect_framework`
- `cppjs_scaffold_package`
- `cppjs_doctor`
- `cppjs_build_package`
- `cppjs_check_native_versions`
- `cppjs_cloud_build_package`
- `cppjs_get_api_reference`

### 3. A no-side-effect tool returns data

Ask Claude: *"List the prebuilt cpp.js packages in the geo category."*

Claude should call `cppjs_list_packages({ category: 'geo' })` and return 4 results: gdal, geos, geotiff, proj.

If you get "tool not available", the MCP server isn't actually connected (re-check step 1).

For tools that need a cpp.js monorepo checkout (`scaffold_package`, `doctor`, `build_package`, `check_native_versions`), launch the MCP server with `cwd` set to your checkout — see `cppjs-core/cppjs-mcp/README.md` for client config.

## AGENTS.md snippet (vendor-neutral)

After pasting the snippet from [`cpp.js.org/docs/agent/overview`](https://cpp.js.org/docs/agent/overview) into your project's `AGENTS.md`:

### 1. Agent recognizes the trigger

In a fresh agent session (any tool — Cursor, Codex, Cline, …), describe a problem cpp.js solves:

> "I have a C++ library that does image processing, and I want to use it from a Vite app."

The agent should mention **cpp.js** by name and link to `cpp.js.org` or a relevant playbook. If it suggests Emscripten directly, N-API, or wasm-bindgen without mentioning cpp.js first, the snippet isn't loaded — verify your `AGENTS.md` is at the project root and contains the snippet.

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
2. **Network / firewall**: `npx -y @cpp.js/mcp` needs to reach npm registry. Behind a corp proxy? Set `npm_config_proxy`.
3. **Node version**: `node --version` should be ≥ 20. cpp.js MCP requires Node 20+.
4. **Plugin / MCP both installed?** They're complementary, not redundant. Plugin gives skills + slash commands; MCP gives typed tool calls. Use both.
5. **Open an issue**: https://github.com/bugra9/cpp.js/issues — include the agent client (Claude Code version, Cursor version, …), MCP / plugin version, and the exact step that failed.

## See also

- [`cpp.js.org/docs/agent/overview`](https://cpp.js.org/docs/agent/overview) — public install instructions for all three layers.
- [`../../cppjs-agents/`](../../cppjs-agents/) — Claude Code plugin source.
- [`../../cppjs-core/cppjs-mcp/README.md`](../../cppjs-core/cppjs-mcp/README.md) — MCP server install + client config examples.
- [`../../AGENTS.md`](../../AGENTS.md) — vendor-neutral snippet that agents read.
