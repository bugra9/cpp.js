/**
 * Resolves *where* the create-cpp.js scaffolder comes from. Two modes:
 *
 *   npm   -> `npm create cpp.js@<tag> -- <args>`  (default; tests the published
 *            beta exactly as an end user would get it)
 *   local -> build templates/ from the current working tree, `npm pack` the
 *            package, then run that tarball's bin. Validates the scaffolder you
 *            are about to publish. NOTE: the scaffolded project's @cpp.js/*
 *            dependencies still resolve from npm, so local mode also surfaces
 *            "is this workspace version actually published?" failures.
 *
 * Each resolver returns { describe, invoke(args) -> {command, args}, cleanup? }.
 */

const fs = require('node:fs');
const path = require('node:path');
const { run } = require('./exec');

const REPO_ROOT = path.resolve(__dirname, '../..');
const PKG_DIR = path.join(REPO_ROOT, 'cppjs-core/cppjs-core-create-app');

function npmSource(tag) {
    // npx --yes runs the published bin non-interactively (no "Ok to proceed?" prompt),
    // exactly as `npm create cpp.js@<tag>` would, but without the install confirmation.
    return {
        describe: `npx create-cpp.js@${tag}`,
        invoke: (args) => ({ command: 'npx', args: ['--yes', `create-cpp.js@${tag}`, ...args] }),
    };
}

async function localSource(logStream) {
    const built = await run('node', ['scripts/build-templates.js'], { cwd: PKG_DIR, logStream, label: 'build-templates' });
    if (!built.ok) throw new Error('build-templates.js failed — cannot pack the local scaffolder (see log)');

    const packed = await run('npm', ['pack'], { cwd: PKG_DIR, logStream, label: 'npm pack' });
    if (!packed.ok) throw new Error('npm pack failed (see log)');

    // npm pack names the tarball deterministically as <name>-<version>.tgz.
    const { name, version } = JSON.parse(fs.readFileSync(path.join(PKG_DIR, 'package.json'), 'utf8'));
    const tarballName = `${name.replace('@', '').replace('/', '-')}-${version}.tgz`;
    const tarball = path.join(PKG_DIR, tarballName);
    if (!fs.existsSync(tarball)) throw new Error(`Expected tarball not found after pack: ${tarball}`);

    return {
        describe: `local pack (${tarballName})`,
        // `npm exec --package=<tarball>` installs the tarball + its deps in a temp prefix and runs
        // its bin. (Bare `npx <tarball-path>` is misparsed as an executable file by npm 10.)
        invoke: (args) => ({ command: 'npm', args: ['exec', '--yes', `--package=${tarball}`, '--', 'create-cpp.js', ...args] }),
        cleanup: () => fs.rmSync(tarball, { force: true }),
    };
}

async function resolveSource({ source, tag, logStream }) {
    if (source === 'local') return localSource(logStream);
    if (source === 'npm') return npmSource(tag);
    throw new Error(`Unknown --source "${source}" (expected "npm" or "local")`);
}

module.exports = { resolveSource, PKG_DIR };
