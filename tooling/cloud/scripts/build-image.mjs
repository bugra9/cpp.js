// Assembles the compiler image's build context in .build/ and builds it: the Dockerfile, the compiler and
// crossbind from this repository with the dependencies the workspace lockfile pins, on the web toolchain image that
// crossbind pins. The context's hash goes to .build/version. Beside it go the contexts of the cloud runners,
// .build/runner-<image>/; wrangler builds every image from these contexts on deploy.
// usage: node scripts/build-image.mjs [--amd64] [--tag <name>] [--context-only]
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDockerImage } from '../../../core/crossbind/src/utils/pullDockerImage.js';
import { RUNNER_IMAGES } from '../worker/runner-api.js';
import { IMAGE_PLATFORMS, deployCli, packModules } from './node-modules.mjs';

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = path.resolve(PACKAGE_DIR, '../..');
const CLI_DIR = path.join(REPO_DIR, 'core', 'crossbind');
const CONTEXT = path.join(PACKAGE_DIR, '.build');
const RUNNER_TEMPLATE = path.join(PACKAGE_DIR, 'runner');
const RUNNER_SOURCE = path.join(CLI_DIR, 'src', 'runner');
const DEFAULT_TAG = 'crossbind-playground-compiler:dev';
const CLI_CONTEXT = path.join(CONTEXT, 'crossbind');
const MODULES_CONTEXT = path.join(CONTEXT, 'compiler', 'template', 'node_modules');

const argValue = (name, fallback) => {
    const at = process.argv.indexOf(name);
    return at === -1 ? fallback : process.argv[at + 1];
};
const platform = process.argv.includes('--amd64') ? 'linux/amd64' : undefined;
const tag = argValue('--tag', DEFAULT_TAG);
const baseImage = getDockerImage('web', platform);

const filesBelow = (dir) => fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();

fs.rmSync(CONTEXT, { recursive: true, force: true });
fs.mkdirSync(CONTEXT, { recursive: true });
// wrangler passes no build arguments, so the base image is written into the Dockerfile itself.
const dockerfile = fs.readFileSync(path.join(PACKAGE_DIR, 'Dockerfile'), 'utf8').replace(/^ARG BASE_IMAGE$/m, `ARG BASE_IMAGE=${baseImage}`);
fs.writeFileSync(path.join(CONTEXT, 'Dockerfile'), dockerfile);
fs.cpSync(path.join(PACKAGE_DIR, 'compiler'), path.join(CONTEXT, 'compiler'), { recursive: true });
// Both unpacked here, so the image build fetches nothing and runs no install script.
deployCli(CLI_CONTEXT, IMAGE_PLATFORMS);
packModules(MODULES_CONTEXT);

const hash = crypto.createHash('sha256');
filesBelow(CONTEXT).forEach((file) => hash.update(path.relative(CONTEXT, file)).update(fs.readFileSync(file)));
fs.writeFileSync(path.join(CONTEXT, 'version'), `${hash.digest('hex').slice(0, 16)}\n`);

// After the hash, so a runner change never retires the playground's cached compiles. A runner names its toolchain as a
// build does, android by its amd64 digest (src/actions/run.js), or the runner refuses the build's steps.
function writeRunnerContext(role) {
    const dir = path.join(CONTEXT, `runner-${role}`);
    const image = getDockerImage(role, role === 'android' ? 'linux/amd64' : undefined);
    fs.mkdirSync(path.join(dir, 'runner'), { recursive: true });
    const runnerDockerfile = fs.readFileSync(path.join(RUNNER_TEMPLATE, 'Dockerfile'), 'utf8')
        .replace(/^ARG BASE_IMAGE$/m, `ARG BASE_IMAGE=${image}`)
        .replace(/^ARG RUNNER_ROLE$/m, `ARG RUNNER_ROLE=${role}`);
    fs.writeFileSync(path.join(dir, 'Dockerfile'), runnerDockerfile);
    fs.copyFileSync(path.join(RUNNER_TEMPLATE, 'entrypoint.sh'), path.join(dir, 'entrypoint.sh'));
    fs.readdirSync(RUNNER_SOURCE).filter((file) => file.endsWith('.js'))
        .forEach((file) => fs.copyFileSync(path.join(RUNNER_SOURCE, file), path.join(dir, 'runner', file)));
}
RUNNER_IMAGES.forEach(writeRunnerContext);

if (!process.argv.includes('--context-only')) {
    execFileSync('docker', ['build', ...(platform ? ['--platform', platform] : []), '--tag', tag, CONTEXT], { stdio: 'inherit' });
    process.stdout.write(`built ${tag}\n`);
}
