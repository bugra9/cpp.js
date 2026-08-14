import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import state from '../state/index.js';

// The Rust producer crate + adapters ship in @cpp.js/core-embind-rust. The ENGINE never
// depends on it (same direction rule as core-embind-jsi): the consumer declares it - directly,
// or transitively through a platform plugin - and the engine only resolves it. pnpm keeps
// transitive deps unhoisted, so resolution may need to hop through the declaring plugin.
const PKG = '@cpp.js/core-embind-rust';
const PLUGIN_ANCHORS = [
    '@cpp.js/plugin-react-native',
    '@cpp.js/plugin-vite',
    '@cpp.js/plugin-rollup',
    '@cpp.js/plugin-metro',
    '@cpp.js/plugin-webpack',
];

let cached = null;

export default function resolveEmbindRustRoot() {
    if (cached) return cached;

    const resolveFrom = (baseDir) => {
        try {
            const req = createRequire(path.join(baseDir, 'package.json'));
            return path.dirname(fs.realpathSync(req.resolve(`${PKG}/package.json`)));
        } catch (e) {
            return null;
        }
    };

    const project = state.config?.paths?.project;
    let root = project ? resolveFrom(project) : null;
    if (!root && project) {
        for (const anchor of PLUGIN_ANCHORS) {
            try {
                const req = createRequire(path.join(project, 'package.json'));
                const anchorDir = path.dirname(fs.realpathSync(req.resolve(`${anchor}/package.json`)));
                root = resolveFrom(anchorDir);
                if (root) break;
            } catch (e) { /* this plugin is not installed - try the next anchor */ }
        }
    }
    if (!root) {
        // Monorepo layout: the package ships next to the engine.
        const here = path.dirname(fileURLToPath(import.meta.url));
        const sibling = path.resolve(here, '../../../cppjs-core-embind-rust');
        if (fs.existsSync(`${sibling}/crate/Cargo.toml`)) root = sibling;
    }
    if (!root) {
        throw new Error(`cppjs: Rust bindings need ${PKG} - add it to your (dev)dependencies.`);
    }
    cached = root;
    return root;
}

// The package version, stamped into generated bridge manifests for debuggability.
export function embindRustVersion() {
    try {
        return JSON.parse(fs.readFileSync(`${resolveEmbindRustRoot()}/package.json`, 'utf8')).version ?? 'unknown';
    } catch (e) {
        return 'unknown';
    }
}
