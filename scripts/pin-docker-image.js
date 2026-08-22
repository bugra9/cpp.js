#!/usr/bin/env node
// Writes the published image digests into pullDockerImage.js, so the CLI always pulls exactly the
// images a release produced. The source is the digest table the publish workflow emits from the
// registry's raw manifests - not `docker inspect` on whatever happens to be pulled locally.
//
//   gh run download <run id> -n digests -D /tmp/digests
//   node scripts/pin-docker-image.js /tmp/digests/digests.json
//
// Each image needs two references: the multi-arch index, which a native pull resolves per
// platform, and its linux/amd64 leaf, for the paths where the CLI forces a platform (android).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = path.join(ROOT, 'core', 'crossbind', 'src', 'utils', 'pullDockerImage.js');
const VERSION_FILE = path.join(ROOT, 'tooling', 'docker', 'VERSION');
// Only the images the CLI runs builds in; base and rust-sysroot are build inputs, never pulled.
const ROLES = ['web', 'android'];

const fail = (message) => {
    console.error(`pin-docker-image: ${message}`);
    process.exit(1);
};

const tablePath = process.argv[2];
if (!tablePath) fail('pass the digests.json produced by the publish workflow');

let table;
try {
    table = JSON.parse(fs.readFileSync(tablePath, 'utf8'));
} catch (e) {
    fail(`cannot read ${tablePath}: ${e.message}`);
}

const declared = fs.readFileSync(VERSION_FILE, 'utf8').trim();
if (table.version !== declared) {
    fail(`the table is for ${table.version} but tooling/docker/VERSION says ${declared} - publish that version or update the file`);
}
if (!table.registry) fail('the table has no registry');

const DIGEST = /^sha256:[0-9a-f]{64}$/;
const entries = ROLES.map((role) => {
    const image = table.images?.[role];
    if (!image) fail(`the table has no entry for ${role}`);
    const amd64 = image.platforms?.['linux/amd64'];
    if (!DIGEST.test(image.index ?? '')) fail(`${role}: index digest is missing or malformed`);
    if (!DIGEST.test(amd64 ?? '')) fail(`${role}: no linux/amd64 leaf digest`);
    return { role, index: image.index, amd64 };
});

const body = entries
    .map(({ role, index, amd64 }) =>
        [`    ${role}: {`, `        ref: \`\${REGISTRY}/${role}@${index}\`,`, `        amd64: \`\${REGISTRY}/${role}@${amd64}\`,`, '    },'].join(
            '\n',
        ),
    )
    .join('\n');

const text = fs.readFileSync(TARGET, 'utf8');
if (!/const IMAGES = \{[\s\S]*?\n\};/.test(text)) fail('could not find the IMAGES block in pullDockerImage.js');

const next = text
    .replace(/const REGISTRY = '[^']*';/, `const REGISTRY = '${table.registry}';`)
    .replace(/const IMAGE_VERSION = '[^']*';/, `const IMAGE_VERSION = '${table.version}';`)
    // Only the entries are generated; the comment above the block is hand-written and stays.
    .replace(/(const IMAGES = \{\n)[\s\S]*?(\n\};)/, `$1${body}$2`);

if (next === text) {
    console.log(`pin-docker-image: already pinned to ${table.registry} ${table.version}`);
    process.exit(0);
}
fs.writeFileSync(TARGET, next);
console.log(`pin-docker-image: pinned ${table.registry} ${table.version}`);
entries.forEach(({ role, index, amd64 }) => {
    console.log(`  ${role.padEnd(8)} index ${index.slice(0, 19)}...  amd64 ${amd64.slice(0, 19)}...`);
});
