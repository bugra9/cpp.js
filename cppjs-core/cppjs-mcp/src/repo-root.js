import fs from 'node:fs';
import path from 'node:path';

const MARKERS = ['pnpm-workspace.yaml', 'cppjs-core', 'cppjs-packages'];

export function findCppjsRoot(startDir = process.cwd()) {
    let dir = path.resolve(startDir);
    while (true) {
        if (MARKERS.every((m) => fs.existsSync(path.join(dir, m)))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) return null;
        dir = parent;
    }
}

export function requireCppjsRoot(startDir) {
    const root = findCppjsRoot(startDir);
    if (!root) {
        throw new Error(
            'This tool must run from inside the cpp.js monorepo (looked for pnpm-workspace.yaml + cppjs-core/ + cppjs-packages/). '
            + 'Set the MCP server\'s working directory to your cpp.js checkout, or use a project-facing tool (detect_framework, list_packages, recommend) instead.',
        );
    }
    return root;
}
