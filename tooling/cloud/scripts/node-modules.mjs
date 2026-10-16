import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PACKAGES } from '../compiler/packages.js';

// The node_modules a playground project builds with. The compiler image and the site's prebuilt samples both build on
// these, so an unedited sample's module is the one a compile would make.

const REPO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const CLI_DIR = path.join(REPO_DIR, 'core', 'crossbind');
const EMBIND_RUST_DIR = path.join(REPO_DIR, 'core', 'embind-rust');
// The lockfile and the settings it was resolved under: the overrides and the release-age policy.
const WORKSPACE_FILES = ['package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml'];
// What pnpm records of an install, with timestamps: nothing needs it, and the image hash must not move with it.
const PNPM_STATE = ['.modules.yaml', '.pnpm-workspace-state-v1.json'];
// The compiler image's: linux on either CPU. Without them a deploy is for the machine it runs on.
export const IMAGE_PLATFORMS = Object.freeze(['--os', 'linux', '--cpu', 'x64', '--cpu', 'arm64']);

// crossbind from this repository with every version the workspace lockfile pins; hoisted lays the packages out as npm
// does, and no install script runs. pnpm deploys from a lockfile only with injected workspace packages, of which
// crossbind has none. It records its settings as the install state of the workspace it runs in, after which pnpm would
// reinstall that workspace before running a script, so it runs in a copy holding the lockfile, its settings and
// crossbind alone.
export function deployCli(target, platforms = []) {
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-cli-'));
    const cli = path.join(workspace, path.relative(REPO_DIR, CLI_DIR));
    try {
        WORKSPACE_FILES.forEach((file) => fs.copyFileSync(path.join(REPO_DIR, file), path.join(workspace, file)));
        fs.cpSync(CLI_DIR, cli, { recursive: true, filter: (source) => path.basename(source) !== 'node_modules' });
        execFileSync('pnpm', [
            '--silent', '--filter', 'crossbind', 'deploy', '--prod', '--frozen-lockfile', '--ignore-scripts',
            '--config.inject-workspace-packages=true', '--config.node-linker=hoisted', ...platforms, target,
        ], { cwd: cli, stdio: 'inherit' });
    } finally {
        fs.rmSync(workspace, { recursive: true, force: true });
    }
    PNPM_STATE.forEach((file) => fs.rmSync(path.join(target, 'node_modules', file), { force: true }));
}

// The ports among `packages` (compiler/packages.js), packed from npm at their pinned version and refused unless npm's
// integrity is the one the catalog pins, and @crossbind/core-embind-rust from this repository, which a build without a
// bundler needs for Rust.
export function packModules(target, packages = PACKAGES) {
    const packs = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-packs-'));
    const pack = (args, cwd) => JSON.parse(execFileSync('npm', ['pack', ...args, '--json', '--ignore-scripts', '--pack-destination', packs], { cwd, encoding: 'utf8' }))[0];
    const unpack = (tarball, name) => {
        const dir = path.join(target, name);
        fs.mkdirSync(dir, { recursive: true });
        execFileSync('tar', ['-xzf', path.join(packs, tarball), '-C', dir, '--strip-components=1']);
    };
    try {
        const tarballs = packages.flatMap(({ version, tarballs: own = [] }) => own.map((tarball) => ({ ...tarball, version })));
        tarballs.forEach(({ name, version, integrity }) => {
            const packed = pack([`${name}@${version}`]);
            if (packed.integrity !== integrity) throw new Error(`${name}@${version} is ${packed.integrity}; compiler/packages.js pins ${integrity}.`);
            unpack(packed.filename, name);
        });
        // A port's config imports the configs of the ports it depends on.
        const packed = new Set(tarballs.map(({ name }) => name));
        const missing = [...packed]
            .flatMap((name) => Object.keys(JSON.parse(fs.readFileSync(path.join(target, name, 'package.json'), 'utf8')).dependencies ?? {}))
            .filter((dependency) => dependency.startsWith('@crossbind/port-') && !packed.has(dependency));
        if (missing.length) throw new Error(`compiler/packages.js lacks ${[...new Set(missing)].join(', ')}, which a port it lists depends on.`);
        unpack(pack([], EMBIND_RUST_DIR).filename, '@crossbind/core-embind-rust');
    } finally {
        fs.rmSync(packs, { recursive: true, force: true });
    }
}
