#!/usr/bin/env node
// K3 wrapper: run `cppjs licenses --notices --sbom` per package, writing next to each
// dist/prebuilt/<host>/ (the per-variant key of contract E). All logic lives in the CLI.
//
//   node scripts/generate-third-party.js <package-dir> [...more]

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'cppjs-core', 'cpp.js', 'src', 'bin.js');

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('usage: node scripts/generate-third-party.js <package-dir> [...more]');
    process.exit(1);
}

for (const arg of args) {
    const pkgDir = path.resolve(arg);
    const prebuilt = path.join(pkgDir, 'dist', 'prebuilt');
    const hosts = fs.existsSync(prebuilt) ? fs.readdirSync(prebuilt).filter((h) => fs.statSync(path.join(prebuilt, h)).isDirectory()) : [];
    if (hosts.length === 0) {
        console.warn(`generate-third-party: ${path.basename(pkgDir)}: no dist/prebuilt hosts (build first) - skipped`);
        continue;
    }
    for (const host of hosts) {
        const hostDir = path.join(prebuilt, host);
        // Host dirs are <platform>-<arch>-...; the platform pulls in what the artifact
        // statically links beyond the package graph (vendored copies, toolchain runtime).
        const platform = host.split('-')[0];
        execFileSync(
            process.execPath,
            [
                CLI,
                'licenses',
                '--notices',
                path.join(hostDir, 'THIRD-PARTY-LICENSES.md'),
                '--sbom',
                path.join(hostDir, 'sbom.cdx.json'),
                '--platform',
                platform,
            ],
            { cwd: pkgDir, stdio: ['ignore', 'ignore', 'inherit'] },
        );
    }
    console.log(`generate-third-party: ${path.basename(pkgDir)}: ${hosts.length} host(s)`);
}
