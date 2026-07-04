#!/usr/bin/env node
// Gate: every package build recipe that downloads its source (has a getURL) must also pin the
// archive's sha256, so no package can ship fetching-and-compiling unverified C++ from an
// upstream URL. The actual byte-for-byte verification runs at build time
// (downloadAndExtractFile.verifyIntegrity); this is the presence gate that keeps a new package
// or a version bump from slipping through unpinned.
//
//   node scripts/check-source-hashes.js            # report
//   node scripts/check-source-hashes.js --check    # exit non-zero on any missing pin (CI gate)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKGROOT = path.join(ROOT, 'cppjs-packages');
const STRICT = process.argv.includes('--check');

const families = fs
    .readdirSync(PKGROOT)
    .filter((d) => d.startsWith('cppjs-package-'))
    .map((d) => d.replace('cppjs-package-', ''))
    .sort();

const missing = [];
let checked = 0;

for (const family of families) {
    const buildMjs = path.join(PKGROOT, `cppjs-package-${family}`, `cppjs-package-${family}`, 'build.mjs');
    if (!fs.existsSync(buildMjs)) continue;
    const recipe = (await import(pathToFileURL(buildMjs).href)).default;
    if (typeof recipe?.getURL !== 'function') continue; // prebuilt-only, nothing downloaded
    checked += 1;
    if (!recipe.sha256 || !/^[0-9a-f]{64}$/i.test(String(recipe.sha256))) {
        missing.push(family);
    }
}

if (missing.length === 0) {
    console.log(`cppjs: source hashes OK — every source-building package pins a sha256 (${checked} packages).`);
    process.exit(0);
}

console.error('cppjs: packages that download their source but do NOT pin a sha256:\n');
missing.forEach((f) => console.error(`  - @cpp.js/package-${f}`));
console.error(`\nRun: node scripts/pin-source-hash.js ${missing.join(' ')}`);
process.exit(STRICT ? 1 : 0);
