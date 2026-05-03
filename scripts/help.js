#!/usr/bin/env node
/**
 * Pretty-print every `pnpm run` script in the root package.json, grouped by
 * top-level prefix (build / clear / ci / e2e / publish / check / other), with
 * a one-line annotation per script.
 *
 * Annotations live in this file (ANNOTATIONS map) — keep them aligned with
 * package.json. If a script has no annotation here, it still prints under
 * "Other" with the raw command for context.
 *
 * Usage:
 *   pnpm run help                # default invocation
 *   node scripts/help.js
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const scripts = pkg.scripts || {};

// One-line description per script. Order doesn't matter.
const ANNOTATIONS = {
    // build
    'build:packages': 'Build every @cpp.js/package-* (pnpm topological order)',
    'build:samples': 'Build every @cpp.js/sample-*',
    'build:samples:lib': 'Build sample-lib-* packages (the C++ library samples)',
    'build:samples:lib:wasm': 'Build sample-lib-* for wasm only',
    'build:samples:lib:android': 'Build sample-lib-* for android only',
    'build:samples:lib:ios': 'Build sample-lib-* for iOS only',
    'build:samples:wasm': 'Build all wasm-targeting samples (web/cloud/backend) + sample-lib wasm',
    'build:website': 'Build the Docusaurus site',
    build: 'build:packages then build:samples (full)',

    // clear
    'clear:cache:samples': "Remove samples' .cppjs/ cache dirs",
    'clear:cache:packages': "Remove packages' .cppjs/ cache dirs",
    'clear:cache': 'Both samples + packages cache',
    'clear:dist:samples': "Remove samples' dist/ + *.xcframework",
    'clear:dist:packages': "Remove packages' dist/ + *.xcframework",
    'clear:dist:packages:android': 'Remove only android dist/ for packages',
    'clear:dist': 'Both samples + packages dist',
    'clear:pack': 'Remove published .tgz files (workspace-scoped, never node_modules)',
    'clear:samples': 'samples cache + dist',
    'clear:packages': 'packages cache + dist',
    'clear:packages:android': 'packages cache + android-only dist',
    clear: 'All clear: cache + dist + pack',
    'pack:list': 'List existing .tgz files under cppjs-packages/',

    // ci
    'ci:linux:build:package': 'CI linux: build the zlib package as a smoke test',
    'ci:linux:build': 'CI linux: build all samples + zlib package',
    'ci:windows:build': 'CI windows: build wasm + android sample-lib + zlib',
    'ci:ios:build:package': 'CI macos: build zlib for iOS',
    'ci:macos:build': 'CI macos: build sample-lib for iOS + zlib for iOS',

    // e2e
    'e2e:dev': 'Playwright e2e against dev servers (workspace-concurrency=1)',
    'e2e:prod': 'Playwright e2e against built artifacts',
    'e2e:ios': 'iOS e2e via Maestro',
    'e2e:android': 'Android e2e via Maestro',
    'e2e:mobile': 'iOS + android e2e',
    e2e: 'dev + prod + mobile e2e',

    // publish
    'publish:samples': 'npm publish all @cpp.js/sample-*',
    'publish:plugins': 'npm publish all @cpp.js/plugin-*',
    'publish:core': 'npm publish cpp.js (core)',
    'publish:all': 'core + plugins + samples',
    'publish:changeset': 'changeset publish',
    'publish:beta': 'Publish all @cpp.js/* under the beta tag',

    // check
    'check:dist': 'Verify each package has prebuilt artifacts for expected targets',
    'check:beta': 'Inventory npm beta tags + package sizes',
    'check:deps': 'External npm dependency drift report (info)',
    'check:deps:strict': 'Same as check:deps but exits non-zero on outdated/unknown',
    'check:native': 'Native library version drift report (GitHub/registry/HTML)',
    'check:native:strict': 'Same as check:native but exits non-zero on outdated/unknown',
    check: 'check:dist + check:deps:strict + check:native:strict (CI-suitable)',

    // self
    help: 'This command — list all pnpm scripts grouped by area',
};

const GROUPS = [
    { title: 'Build', match: /^build/ },
    { title: 'Clear / pack', match: /^(clear|pack)/ },
    { title: 'CI', match: /^ci:/ },
    { title: 'E2E', match: /^e2e/ },
    { title: 'Publish', match: /^publish/ },
    { title: 'Check', match: /^check/ },
    { title: 'Other', match: /^/ }, // catch-all
];

const buckets = new Map(GROUPS.map((g) => [g.title, []]));
const claimed = new Set();
for (const name of Object.keys(scripts).sort()) {
    if (claimed.has(name)) continue;
    for (const g of GROUPS) {
        if (g.match.test(name)) {
            buckets.get(g.title).push(name);
            claimed.add(name);
            break;
        }
    }
}

const nameWidth = Math.max(...Object.keys(scripts).map((n) => n.length), 'Script'.length);

function printGroup(title, names) {
    if (!names.length) return;
    process.stdout.write(`\n${title}\n`);
    process.stdout.write(`${'-'.repeat(title.length)}\n`);
    for (const name of names) {
        const ann = ANNOTATIONS[name] || `(no annotation — runs: ${scripts[name]})`;
        process.stdout.write(`  ${name.padEnd(nameWidth + 2)}${ann}\n`);
    }
}

process.stdout.write('cpp.js — pnpm scripts\n');
process.stdout.write('Run any script with `pnpm run <name>` (or `pnpm <name>` if unambiguous).\n');
for (const g of GROUPS) printGroup(g.title, buckets.get(g.title));
process.stdout.write('\nFor agent docs see AGENTS.md, ARCHITECTURE.md, CODEMAP.md.\n');
