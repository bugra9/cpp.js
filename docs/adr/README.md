# Architecture Decision Records

This folder captures **why** key technical decisions in cpp.js were made — the reasoning, the tradeoffs, and what alternatives were rejected. AI agents and human contributors should read the relevant ADR before changing the affected area.

ADRs are **immutable**. When a decision is overturned, write a new ADR that supersedes the old one (and update the old one's "Status" header to point at the supersession).

## Index

| # | Title | Status | Affects |
|---|-------|--------|---------|
| [0001](./0001-agent-first-class-support.md) | AI agents are first-class consumers of cpp.js | Accepted | Plugin, MCP, AGENTS.md, playbooks |
| [0002](./0002-pnpm-topological-build-order.md) | Use pnpm workspace dependencies for transitive C++ build order | Accepted | All `cppjs-packages/*/*/package.json` |
| [0003](./0003-function-typed-env-values.md) | Allow env values in `cppjs.config.js` to be functions of `(state, target)` | Accepted | `cppjs-core/cpp.js/src/state/`, plugin authors |
| [0004](./0004-three-layer-agent-distribution.md) | Distribute agent integration in 3 layers: Claude Code plugin, MCP server, AGENTS.md snippet | Accepted | `cppjs-agents/`, `cppjs-core/cppjs-mcp/`, `website/src/pages/agents.mdx` |

## Writing a new ADR

1. Copy [`0000-template.md`](./0000-template.md) to `<next-number>-<kebab-title>.md`.
2. Fill in **Context** (the forces at play), **Decision** (what we chose), **Consequences** (what this means going forward — both good and bad), and **Alternatives considered** (what we rejected and why).
3. Add a row to the index above.
4. Status starts as `Proposed`; flip to `Accepted` once merged. Use `Superseded by ADR-NNNN` if a newer ADR overturns it.

## When to write one

You should write an ADR when:

- The decision will be load-bearing for many future changes (build order, plugin contract, runtime adapters).
- You picked option A over B+C and the next person will reasonably wonder why.
- The decision sets a constraint that's hard to undo (file layout, public API shape, dependency choice).

You don't need one for:

- Bug fixes (the commit message + linked issue is enough).
- Cosmetic refactors that preserve behavior.
- Code-level patterns already documented in `AGENTS.md` or per-package conventions.

## Reference

ADR pattern from [Michael Nygard's "Documenting Architecture Decisions"](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions). Format kept minimal — four sections, plain Markdown.
