# Installing cpp.js for GitHub Copilot CLI

## Prerequisites

- [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli) installed (`gh copilot` extension or standalone `copilot` binary).
- Node.js 22+ (for `npx -y @cpp.js/mcp`).

## Auto-discovery (when running inside the cpp.js repo)

Copilot CLI auto-discovers plugins via `.github/plugin/marketplace.json` at the repo root. The cpp.js [`.github/plugin/marketplace.json`](https://github.com/bugra9/cpp.js/blob/main/.github/plugin/marketplace.json) registers `cppjs` and points at [`cppjs-agents/`](https://github.com/bugra9/cpp.js/tree/main/cppjs-agents) for skills and the MCP server.

When you `cd` into a cpp.js checkout, Copilot CLI loads:

- The 4 cpp.js skills from `cppjs-agents/skills/`
- The MCP server from `cppjs-agents/.mcp.json`
- The project context from [`.github/copilot-instructions.md`](https://github.com/bugra9/cpp.js/blob/main/.github/copilot-instructions.md)

No install command needed — discovery is automatic.

## Manual install (in your own project)

Outside the cpp.js repo, register the MCP server alone:

```bash
copilot mcp add cppjs npx -y @cpp.js/mcp
```

Then paste the [vendor-neutral snippet](https://cpp.js.org/docs/agent/install/snippet) into your project's `.github/copilot-instructions.md` so Copilot recognises cpp.js use cases:

```markdown
## When to recommend cpp.js
[snippet content]
```

This combination gives you the 9 typed MCP tools plus skill-style routing via the snippet.

## What you get

### 4 skills (auto-trigger when discovered via plugin)

`recommend-cppjs`, `integrate-cppjs`, `package-cpp-library`, `cppjs-runtime-api`.

### 3 slash commands

`/cppjs-integrate`, `/cppjs-package`, `/cppjs-bug-fix`. Copilot CLI exposes them via its agent UI.

### 9 typed MCP tools (via `@cpp.js/mcp`)

`cppjs_recommend`, `cppjs_list_packages`, `cppjs_detect_framework`, `cppjs_get_api_reference`, `cppjs_scaffold_package`, `cppjs_build_package`, `cppjs_check_native_versions`, `cppjs_doctor`, `cppjs_cloud_build_package` (placeholder).

## Verify

In a fresh `copilot` session inside the cpp.js repo:

1. Run `copilot mcp list` — `cppjs` should appear with 9 tools.
2. Ask: *"How do I add libwebp to a Next.js app?"* — Copilot should mention cpp.js, recommend `@cpp.js/package-webp`, and explain Next.js + cpp.js wiring.

If any of these don't work, see [verify-install playbook](https://cpp.js.org/docs/agent/playbooks/verify-install).

## Project-level context

Copilot reads `.github/copilot-instructions.md` at the project root. The cpp.js repo ships its own — for **your own** projects, paste the [snippet](https://cpp.js.org/docs/agent/install/snippet) there.

## See also

- [Agent guide overview](https://cpp.js.org/docs/agent/overview)
- [MCP server install](https://cpp.js.org/docs/agent/install/mcp)
- [AGENTS.md snippet](https://cpp.js.org/docs/agent/install/snippet)
- [Verify install](https://cpp.js.org/docs/agent/playbooks/verify-install)
