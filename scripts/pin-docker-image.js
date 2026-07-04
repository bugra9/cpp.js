#!/usr/bin/env node
// Re-derives the build image's registry digest from its tag and writes it into pullDockerImage.js,
// so the pinned digest (IMAGE) stays in sync with the tag (IMAGE_TAG) whenever the image is
// republished. Run after `docker push`-ing a new image. Requires the tagged image pulled locally
// (docker pull bugra9/cpp.js:<tag>) so its RepoDigest is known.
//
//   node scripts/pin-docker-image.js

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'cppjs-core', 'cpp.js', 'src', 'utils', 'pullDockerImage.js');

const text = fs.readFileSync(FILE, 'utf8');
const tag = text.match(/const IMAGE_TAG = '([^']+)'/)?.[1];
if (!tag) {
    console.error('pin-docker-image: could not find IMAGE_TAG in pullDockerImage.js');
    process.exit(1);
}
if (!/const IMAGE = '[^']*';/.test(text)) {
    console.error('pin-docker-image: could not find the IMAGE constant to update in pullDockerImage.js');
    process.exit(1);
}

let repoDigest;
try {
    repoDigest = execFileSync('docker', ['inspect', '--format', '{{index .RepoDigests 0}}', tag], { encoding: 'utf8' }).trim();
} catch {
    console.error(`pin-docker-image: '${tag}' is not available locally. Run: docker pull ${tag}`);
    process.exit(1);
}
if (!/^[^@]+@sha256:[0-9a-f]{64}$/.test(repoDigest)) {
    console.error(`pin-docker-image: no registry digest for ${tag} (built locally but never pushed?). Got: ${repoDigest || '(empty)'}`);
    process.exit(1);
}

const next = text.replace(/const IMAGE = '[^']*';/, `const IMAGE = '${repoDigest}';`);
if (next === text) {
    console.log(`pin-docker-image: already pinned to ${repoDigest}`);
    process.exit(0);
}
fs.writeFileSync(FILE, next);
console.log(`pin-docker-image: pinned ${tag} -> ${repoDigest}`);
