import fs from 'node:fs';
import path from 'node:path';

const MARKERS = ['pnpm-workspace.yaml', 'core', 'ports'];

export function findCrossbindRoot(startDir = process.cwd()) {
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

export function requireCrossbindRoot(startDir) {
    const root = findCrossbindRoot(startDir);
    if (!root) {
        throw new Error(
            'This tool must run from inside the crossbind monorepo (looked for pnpm-workspace.yaml + core/ + ports/). '
            + 'Set the MCP server\'s working directory to your crossbind checkout, or use a project-facing tool (detect_framework, list_packages, recommend) instead.',
        );
    }
    return root;
}
