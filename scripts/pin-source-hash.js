#!/usr/bin/env node
// Downloads each package's pinned-version source tarball and writes its sha256 into the build
// recipe (build.mjs), next to getURL, so cpp.js can verify the download at build time (see
// downloadAndExtractFile.verifyIntegrity). Run after bumping a package's nativeVersion.
//
//   node scripts/pin-source-hash.js             # every family with a getURL recipe
//   node scripts/pin-source-hash.js tiff gdal   # specific families

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKGROOT = path.join(ROOT, 'cppjs-packages');
const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));

function families() {
    if (args.length) return args;
    return fs
        .readdirSync(PKGROOT)
        .filter((d) => d.startsWith('cppjs-package-'))
        .map((d) => d.replace('cppjs-package-', ''))
        .sort();
}

function sha256OfUrl(url) {
    const tmp = path.join(os.tmpdir(), `cppjs-pin-${crypto.randomBytes(6).toString('hex')}`);
    try {
        execFileSync('curl', ['-fsSL', '--retry', '2', url, '-o', tmp], { stdio: ['ignore', 'ignore', 'pipe'] });
        return crypto.createHash('sha256').update(fs.readFileSync(tmp)).digest('hex');
    } finally {
        fs.rmSync(tmp, { force: true });
    }
}

// Insert or replace the `sha256:` field in a build.mjs. Replaces in place when present; new
// pins go right under `export default {`.
function writeSha256(buildMjsPath, hash, basename) {
    let text = fs.readFileSync(buildMjsPath, 'utf8');
    if (/sha256:\s*'[0-9a-fA-F]*'/.test(text)) {
        text = text.replace(/sha256:\s*'[0-9a-fA-F]*'/, `sha256: '${hash}'`);
    } else {
        text = text.replace(/(export default \{\n)/, `$1    sha256: '${hash}', // ${basename}\n`);
    }
    fs.writeFileSync(buildMjsPath, text);
}

let pinned = 0;
let skipped = 0;
let failed = 0;

for (const family of families()) {
    const brandDir = path.join(PKGROOT, `cppjs-package-${family}`, `cppjs-package-${family}`);
    const buildMjs = path.join(brandDir, 'build.mjs');
    const pkgJson = path.join(brandDir, 'package.json');
    if (!fs.existsSync(buildMjs) || !fs.existsSync(pkgJson)) {
        continue;
    }

    const recipe = (await import(pathToFileURL(buildMjs).href)).default;
    if (typeof recipe?.getURL !== 'function') {
        console.log(`- ${family}: no getURL (prebuilt), skipped`);
        skipped += 1;
        continue;
    }
    const version = JSON.parse(fs.readFileSync(pkgJson, 'utf8')).nativeVersion;
    if (!version) {
        console.log(`- ${family}: no nativeVersion, skipped`);
        skipped += 1;
        continue;
    }

    const url = recipe.getURL(version);
    try {
        const hash = sha256OfUrl(url);
        const basename = path.basename(new URL(url).pathname) || `${family}-${version}`;
        writeSha256(buildMjs, hash, basename);
        console.log(`✓ ${family}@${version}  ${hash}`);
        pinned += 1;
    } catch (e) {
        console.error(`✗ ${family}@${version}  FAILED: ${String(e.message).split('\n')[0]}\n     ${url}`);
        failed += 1;
    }
}

console.log(`\npinned ${pinned}, skipped ${skipped}, failed ${failed}`);
process.exit(failed ? 1 : 0);
