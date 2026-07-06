import { execFileSync } from 'node:child_process';
import { getContentHash } from './hash.js';

// The build toolchain image is pinned by digest, not just by tag, so a hijacked or re-pushed
// tag on the registry can't silently swap the compiler out from under a build. IMAGE_TAG is the
// same image kept only for a readable, stable container name — a digest's '@sha256:...' is not
// valid in a Docker container name. Bump BOTH together when publishing a new image
// (scripts/pin-docker-image.js reads the digest back from the registry).
const IMAGE_TAG = 'bugra9/cpp.js:0.3.3';
const IMAGE = 'bugra9/cpp.js@sha256:fbef6cff4c84b5ef2fb4fe1c6f5de2920327c55ff1f3bfbb60c8628dc2e8711d';

let isDockerImageAvailable = false;

export function getDockerImage() {
    return IMAGE;
}

export function getDockerContainerName(base) {
    return `${IMAGE_TAG}-${getContentHash(base)}`.replaceAll('/', '-').replaceAll(':', '-');
}

// `docker images -q` does not resolve a digest reference (returns empty), so the existence check
// uses `docker image inspect`, which works for both tag and digest refs.
function isImagePresent(ref) {
    try {
        execFileSync('docker', ['image', 'inspect', ref], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

export default function pullDockerImage() {
    if (isDockerImageAvailable) return;

    if (!isImagePresent(getDockerImage())) {
        console.log('');
        console.log('===========================================================');
        console.log('============= Downloading the docker image... =============');
        console.log('===========================================================');
        console.log('');
        execFileSync('docker', ['pull', getDockerImage()], { stdio: 'inherit' });
        console.log('');
        console.log('===========================================================');
        console.log('');
    }

    isDockerImageAvailable = true;
}
