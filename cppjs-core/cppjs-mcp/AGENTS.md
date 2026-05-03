# AGENTS.md — @cpp.js/mcp

You're editing the **MCP server** for cpp.js. It exposes typed tools to MCP clients (Claude Desktop, Claude Code, Cursor, Codex, …) over stdio JSON-RPC.

## Layout

```
cppjs-mcp/
├── package.json            (npm: @cpp.js/mcp, bin: cppjs-mcp)
├── bin/cppjs-mcp.js        (#!/usr/bin/env node shim → src/index.js)
├── src/
│   ├── index.js            (McpServer + StdioServerTransport, tool registration loop)
│   ├── repo-root.js        (find/require cpp.js monorepo root via marker triple)
│   ├── run-script.js       (spawn helpers: runProcess, runNodeScript; capped buffers)
│   └── tools/
│       ├── detect-framework.js     (no-monorepo: wraps scripts/detect-framework.js)
│       ├── list-packages.js        (no-monorepo: hardcoded catalog)
│       ├── recommend.js            (no-monorepo: routing payload)
│       ├── scaffold-package.js     (monorepo: wraps scripts/scaffold-package.js)
│       ├── doctor.js               (monorepo: wraps scripts/doctor.sh)
│       ├── build-package.js        (monorepo: pnpm --filter ... run build)
│       ├── check-native-versions.js (monorepo: wraps scripts/check-native-versions.js)
│       └── cloud-build-package.js  (placeholder)
├── README.md
└── AGENTS.md (this file)
```

## Tool contract

Each tool module exports three things:

```js
export const name = 'cppjs_<tool_name>';   // snake_case, MCP-side identifier
export const config = {
    title: '...',
    description: '...',                    // shown to the LLM — keep punchy and accurate
    inputSchema: { /* ZodRawShape */ },    // NOT z.object(...). Pass the raw shape.
};
export async function handler(args) {
    return { content: [{ type: 'text', text: '...' }] };
    // For errors: return { isError: true, content: [...] } — do NOT throw.
}
```

`src/index.js` imports the module namespace and calls `server.registerTool(name, config, handler)`. Adding a tool = drop a file in `src/tools/`, add an import + push to the `TOOLS` array in `src/index.js`.

## Conventions

- **Never throw from handlers.** Always return `{ isError: true, content: [...] }`. The wrapper in `src/index.js` catches throws as a last resort but prefer explicit error responses.
- **Never write to stdout.** stdio is the MCP transport; any stray `console.log` corrupts the JSON-RPC stream. Use `process.stderr.write` for diagnostics.
- **Subprocess output goes through `run-script.js`.** It caps buffers at 1 MB with mid-truncation so a runaway build can't OOM the server.
- **Monorepo-required tools call `requireCppjsRoot()`.** It throws a clear error if cwd isn't inside a cpp.js checkout. Project-facing tools call `findCppjsRoot()` (returns null) and degrade gracefully.
- **Add long-running tools cautiously.** The default subprocess timeout is 10 min. `cppjs_build_package` overrides to 30 min. Don't go higher without justification — the MCP client will block on the call.

## Adding a tool

1. Create `src/tools/<kebab-name>.js` with the three exports.
2. Import + push in `src/index.js`.
3. Add a row to the README "Tools" table.
4. If it's monorepo-only, document that in the description (the LLM reads it before calling).

## Don't

- Bind to internals of `cppjs-core/cpp.js/`. The MCP wraps **scripts** and **pnpm**, not source modules. This isolates us from refactors of the build pipeline.
- Read or cache state across tool calls. Each call is stateless — that's how MCP works.
- Use `console.log` anywhere. stderr only.
- Add tools that mutate the user's filesystem outside of `cwd` without the user opting in via an explicit arg.

## Reference

- MCP spec: https://modelcontextprotocol.io
- SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Pairs with the Claude Code plugin in `cppjs-agents/`.
