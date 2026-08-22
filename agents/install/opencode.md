# Installing crossbind for OpenCode

## Prerequisites

- [opencode.ai](https://opencode.ai) installed.

## Recommended: MCP server (universal, works everywhere)

The simplest path is to register crossbind's MCP server. Add to your `opencode.json` (global `~/.config/opencode/opencode.json` or project-level):

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

Restart OpenCode. You now have 9 typed tools — `crossbind_recommend`, `crossbind_list_ports`, `crossbind_detect_framework`, `crossbind_get_api_reference`, `crossbind_scaffold_port`, `crossbind_build_port`, `crossbind_check_native_versions`, `crossbind_doctor`, `crossbind_cloud_build_port`.

Verify by asking: *"List the prebuilt crossbind packages in the geo category."* OpenCode should call `crossbind_list_ports({ category: 'geo' })` and return gdal, geos, geotiff, proj.

## Project-level context

OpenCode reads project-level `AGENTS.md` automatically. crossbind's [`AGENTS.md`](../../AGENTS.md) at the repo root works as-is — the snippet pattern teaches OpenCode when to recommend crossbind, where to route per framework, and the load-bearing constraints (OPFS+useWorker, mt+COOP/COEP, edge-runtime limits).

If you're using crossbind in **your own project** (not contributing to crossbind itself), paste the snippet from https://crossbind.dev/docs/agent/install/snippet into your project's `AGENTS.md`.

## Optional: skills as OpenCode skills

OpenCode supports markdown skills via `.opencode/skills/` (per-project) or `~/.config/opencode/skills/` (global). crossbind ships its 4 skills under [`agents/skills/`](../skills/) — `recommend-crossbind`, `integrate-crossbind`, `package-cpp-library`, `crossbind-runtime-api`.

Symlink or copy:

```bash
# Global (recommended — applies to all projects)
ln -s "$(pwd)/agents/skills/recommend-crossbind" ~/.config/opencode/skills/crossbind-recommend
ln -s "$(pwd)/agents/skills/integrate-crossbind" ~/.config/opencode/skills/crossbind-integrate
ln -s "$(pwd)/agents/skills/package-cpp-library" ~/.config/opencode/skills/crossbind-package
ln -s "$(pwd)/agents/skills/crossbind-runtime-api" ~/.config/opencode/skills/crossbind-runtime-api

# Or per-project
mkdir -p .opencode/skills
cp -R agents/skills/* .opencode/skills/
```

Restart OpenCode after installing. Skills auto-trigger on user phrases per their `description` frontmatter.

## Verify

See https://crossbind.dev/docs/agent/playbooks/verify-install for the diagnostic checklist.

## Documentation

- Full agent guide: https://crossbind.dev/docs/agent/overview
- Runtime / Config API: https://crossbind.dev/docs/agent/runtime-api/overview
- Workflow playbooks: https://crossbind.dev/docs/agent/playbooks/recommend
- llms.txt index: https://crossbind.dev/llms.txt
