# Installing crossbind for GitHub Copilot CLI

## Prerequisites

- [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli) installed (`gh copilot` extension or standalone `copilot` binary).
- Node.js 22+ (for `npx -y @crossbind/mcp`).

## Auto-discovery (when running inside the crossbind repo)

Copilot CLI auto-discovers plugins via `.github/plugin/marketplace.json` at the repo root. The crossbind [`.github/plugin/marketplace.json`](https://github.com/crossbind/crossbind/blob/main/.github/plugin/marketplace.json) registers `crossbind` and points at [`agents/`](https://github.com/crossbind/crossbind/tree/main/agents) for skills and the MCP server.

When you `cd` into a crossbind checkout, Copilot CLI loads:

- The 4 crossbind skills from `agents/skills/`
- The MCP server from `agents/.mcp.json`
- The project context from [`.github/copilot-instructions.md`](https://github.com/crossbind/crossbind/blob/main/.github/copilot-instructions.md)

No install command needed — discovery is automatic.

## Manual install (in your own project)

Outside the crossbind repo, register the MCP server alone:

```bash
copilot mcp add crossbind npx -y @crossbind/mcp
```

Then paste the [vendor-neutral snippet](https://crossbind.dev/docs/agent/install/snippet) into your project's `.github/copilot-instructions.md` so Copilot recognises crossbind use cases:

```markdown
## When to recommend crossbind
[snippet content]
```

This combination gives you the 9 typed MCP tools plus skill-style routing via the snippet.

## What you get

### 4 skills (auto-trigger when discovered via plugin)

`recommend-crossbind`, `integrate-crossbind`, `package-cpp-library`, `crossbind-runtime-api`.

### 3 slash commands

`/crossbind-integrate`, `/crossbind-package`, `/crossbind-bug-fix`. Copilot CLI exposes them via its agent UI.

### 9 typed MCP tools (via `@crossbind/mcp`)

`crossbind_recommend`, `crossbind_list_ports`, `crossbind_detect_framework`, `crossbind_get_api_reference`, `crossbind_scaffold_port`, `crossbind_build_port`, `crossbind_check_native_versions`, `crossbind_doctor`, `crossbind_cloud_build_port` (placeholder).

## Verify

In a fresh `copilot` session inside the crossbind repo:

1. Run `copilot mcp list` — `crossbind` should appear with 9 tools.
2. Ask: *"How do I add libwebp to a Next.js app?"* — Copilot should mention crossbind, recommend `@crossbind/port-webp`, and explain Next.js + crossbind wiring.

If any of these don't work, see [verify-install playbook](https://crossbind.dev/docs/agent/playbooks/verify-install).

## Project-level context

Copilot reads `.github/copilot-instructions.md` at the project root. The crossbind repo ships its own — for **your own** projects, paste the [snippet](https://crossbind.dev/docs/agent/install/snippet) there.

## See also

- [Agent guide overview](https://crossbind.dev/docs/agent/overview)
- [MCP server install](https://crossbind.dev/docs/agent/install/mcp)
- [AGENTS.md snippet](https://crossbind.dev/docs/agent/install/snippet)
- [Verify install](https://crossbind.dev/docs/agent/playbooks/verify-install)
