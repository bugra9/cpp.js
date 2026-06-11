#!/usr/bin/env node
/**
 * Refresh the workspace-excluded, registry-pinned Expo sample with the LOCAL
 * @cpp.js/* workspace packages.
 *
 * The sample pins published versions, so workspace changes never reach it via
 * `npm install`. This script pnpm-packs every workspace package in the sample's
 * dependency closure and installs the tarballs with --no-save, leaving the
 * sample's package.json and package-lock.json untouched.
 *
 * Usage: node scripts/refresh-expo-sample.js [--sample <dir>] [--dry-run]
 * Undo:  cd <sample> && rm -rf node_modules && npm install
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SAMPLE = 'cppjs-samples/cppjs-sample-mobile-reactnative-expo';
const GROUP_DIRS = ['cppjs-core', 'cppjs-plugins', 'cppjs-extensions', 'cppjs-samples'];

function addPackage(map, dir) {
    const pkgPath = path.join(dir, 'package.json');
    if (!fs.existsSync(pkgPath)) return;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.name && !pkg.private) map.set(pkg.name, dir);
}

function workspacePackages() {
    const map = new Map();
    for (const group of GROUP_DIRS) {
        const groupDir = path.join(REPO_ROOT, group);
        if (!fs.existsSync(groupDir)) continue;
        for (const entry of fs.readdirSync(groupDir, { withFileTypes: true })) {
            if (entry.isDirectory()) addPackage(map, path.join(groupDir, entry.name));
        }
    }
    const familiesDir = path.join(REPO_ROOT, 'cppjs-packages');
    if (fs.existsSync(familiesDir)) {
        for (const family of fs.readdirSync(familiesDir, { withFileTypes: true })) {
            if (!family.isDirectory()) continue;
            const familyDir = path.join(familiesDir, family.name);
            for (const entry of fs.readdirSync(familyDir, { withFileTypes: true })) {
                if (entry.isDirectory()) addPackage(map, path.join(familyDir, entry.name));
            }
        }
    }
    return map;
}

function dependencyClosure(sampleDir, workspace) {
    const read = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const sample = read(sampleDir);
    const queue = Object.keys({ ...sample.dependencies, ...sample.devDependencies })
        .filter((name) => workspace.has(name));
    const seen = new Set();
    while (queue.length > 0) {
        const name = queue.shift();
        if (seen.has(name)) continue;
        seen.add(name);
        const pkg = read(workspace.get(name));
        Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies })
            .filter((dep) => workspace.has(dep) && !seen.has(dep))
            .forEach((dep) => queue.push(dep));
    }
    return [...seen].sort();
}

function main() {
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');
    const sampleFlag = args.indexOf('--sample');
    const sampleDir = path.resolve(REPO_ROOT, sampleFlag === -1 ? DEFAULT_SAMPLE : args[sampleFlag + 1]);

    const workspace = workspacePackages();
    const names = dependencyClosure(sampleDir, workspace);
    if (names.length === 0) throw new Error(`No workspace packages found in ${sampleDir}/package.json dependencies.`);

    console.log(`Sample: ${sampleDir}`);
    console.log(`Workspace closure (${names.length}): ${names.join(', ')}`);
    if (isDryRun) return;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cppjs-refresh-'));
    const tarballs = names.map((name) => {
        const dir = workspace.get(name);
        execFileSync('pnpm', ['pack', '--pack-destination', tmpDir], { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'] });
        const { version } = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
        const tarball = path.join(tmpDir, `${name.replace('@', '').replace('/', '-')}-${version}.tgz`);
        if (!fs.existsSync(tarball)) throw new Error(`pnpm pack did not produce ${tarball}`);
        return tarball;
    });

    console.log(`Installing ${tarballs.length} tarballs into the sample (manifest and lock stay untouched)…`);
    execFileSync('npm', ['install', '--no-save', '--no-package-lock', '--legacy-peer-deps', ...tarballs], {
        cwd: sampleDir,
        stdio: 'inherit',
    });
    fs.rmSync(tmpDir, { recursive: true, force: true });

    console.log('Done. Revert with: rm -rf node_modules && npm install');
}

main();
