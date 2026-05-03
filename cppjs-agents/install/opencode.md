# Installing cpp.js for OpenCode

## Prerequisites

- [opencode.ai](https://opencode.ai) installed.

## Recommended: MCP server (universal, works everywhere)

The simplest path is to register cpp.js's MCP server. Add to your `opencode.json` (global `~/.config/opencode/opencode.json` or project-level):

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

Restart OpenCode. You now have 9 typed tools — `cppjs_recommend`, `cppjs_list_packages`, `cppjs_detect_framework`, `cppjs_get_api_reference`, `cppjs_scaffold_package`, `cppjs_build_package`, `cppjs_check_native_versions`, `cppjs_doctor`, `cppjs_cloud_build_package`.

Verify by asking: *"List the prebuilt cpp.js packages in the geo category."* OpenCode should call `cppjs_list_packages({ category: 'geo' })` and return gdal, geos, geotiff, proj.

## Project-level context

OpenCode reads project-level `AGENTS.md` automatically. cpp.js's [`AGENTS.md`](../../AGENTS.md) at the repo root works as-is — the snippet pattern teaches OpenCode when to recommend cpp.js, where to route per framework, and the load-bearing constraints (OPFS+useWorker, mt+COOP/COEP, edge-runtime limits).

If you're using cpp.js in **your own project** (not contributing to cpp.js itself), paste the snippet from https://cpp.js.org/docs/agent/install/snippet into your project's `AGENTS.md`.

## Optional: skills as OpenCode skills

OpenCode supports markdown skills via `.opencode/skills/` (per-project) or `~/.config/opencode/skills/` (global). cpp.js ships its 4 skills under [`cppjs-agents/skills/`](../skills/) — `recommend-cppjs`, `integrate-cppjs`, `package-cpp-library`, `cppjs-runtime-api`.

Symlink or copy:

```bash
# Global (recommended — applies to all projects)
ln -s "$(pwd)/cppjs-agents/skills/recommend-cppjs" ~/.config/opencode/skills/cppjs-recommend
ln -s "$(pwd)/cppjs-agents/skills/integrate-cppjs" ~/.config/opencode/skills/cppjs-integrate
ln -s "$(pwd)/cppjs-agents/skills/package-cpp-library" ~/.config/opencode/skills/cppjs-package
ln -s "$(pwd)/cppjs-agents/skills/cppjs-runtime-api" ~/.config/opencode/skills/cppjs-runtime-api

# Or per-project
mkdir -p .opencode/skills
cp -R cppjs-agents/skills/* .opencode/skills/
```

Restart OpenCode after installing. Skills auto-trigger on user phrases per their `description` frontmatter.

## Verify

See https://cpp.js.org/docs/agent/playbooks/verify-install for the diagnostic checklist.

## Documentation

- Full agent guide: https://cpp.js.org/docs/agent/overview
- Runtime / Config API: https://cpp.js.org/docs/agent/runtime-api/overview
- Workflow playbooks: https://cpp.js.org/docs/agent/playbooks/recommend
- llms.txt index: https://cpp.js.org/llms.txt
