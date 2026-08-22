#!/usr/bin/env node
// Packages the Rust sysroots the web image ships as a standalone, sha256-pinned artifact - the
// second consumption channel for RUNNER=LOCAL. It re-exports the sysroot IMAGE that web.Dockerfile
// COPY --from's rather than rebuilding the stage, so image and archive carry the same bytes by
// construction. buildx writes the tar itself: the archive is the image filesystem, not a host tar
// of an extracted tree (no BSD/GNU tar differences).
//
//   pnpm --dir tooling/docker build:sysroot
//   node scripts/pack-rust-sysroot.js [--image <ref>] [--out <dir>]

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const arg = (flag) => {
    const i = process.argv.indexOf(flag);
    return i !== -1 ? process.argv[i + 1] : null;
};

const image = arg('--image') ?? 'crossbind/rust-sysroot:dev';
const outDir = path.resolve(arg('--out') ?? path.join(ROOT, 'tooling', 'docker', 'dist'));
fs.mkdirSync(outDir, { recursive: true });

// An empty context: the only instruction is the FROM, so nothing is rebuilt.
const context = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-pack-'));
const exportImage = (output) =>
    execFileSync('docker', ['build', '-f', '-', '--output', output, context], {
        input: `FROM ${image}\n`,
        stdio: ['pipe', 'inherit', 'inherit'],
    });

const tarPath = path.join(outDir, 'crossbind-rust-sysroot.tar');
exportImage(`type=tar,dest=${tarPath}`);

// The manifest inside the archive is the contract; surface it next to the tar so a release can
// name the artifact after the toolchain it carries without unpacking it again.
const manifestPath = path.join(outDir, 'manifest.json');
exportImage(`type=local,dest=${outDir}/.extract`);
fs.rmSync(context, { recursive: true, force: true });

const extracted = path.join(outDir, '.extract', 'opt', 'crossbind', 'rust');
const [version] = fs.readdirSync(extracted);
fs.copyFileSync(path.join(extracted, version, 'manifest.json'), manifestPath);
fs.rmSync(path.join(outDir, '.extract'), { recursive: true, force: true });

const sha256 = crypto.createHash('sha256').update(fs.readFileSync(tarPath)).digest('hex');
const named = path.join(outDir, `crossbind-rust-sysroot-${version}.tar`);
fs.renameSync(tarPath, named);
fs.writeFileSync(`${named}.sha256`, `${sha256}  ${path.basename(named)}\n`);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
console.log(`pack-rust-sysroot: ${path.relative(ROOT, named)}`);
console.log(`  rustc    ${manifest.rustc} (${manifest.rustcCommit.slice(0, 12)})`);
console.log(`  emsdk    ${manifest.emsdk}   target ${manifest.target}   panic ${manifest.panic}`);
console.log(`  size     ${(fs.statSync(named).size / 1024 / 1024).toFixed(1)} MB`);
console.log(`  sha256   ${sha256}`);
