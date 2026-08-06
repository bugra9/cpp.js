import { execFileSync } from 'node:child_process';
import { getContentHash } from './hash.js';

// Digest-pinned so a re-pushed tag can't swap the compiler; IMAGE_TAG only names containers - bump all pins via scripts/pin-docker-image.js.
const IMAGE_TAG = 'bugra9/cpp.js:0.3.5';
const IMAGE = 'bugra9/cpp.js@sha256:044eee6f4dd55e1f3e88a92f075cba40d3eaa8447f18a30d6408156282fee8f1';
// amd64 leaf of the same index: android must run x86_64 (NDK), and the classic image store holds one platform per digest ref.
const IMAGE_AMD64 = 'bugra9/cpp.js@sha256:fc318dfb1f3884b30f0b7045d9bd4bb73b923ae70822e5ac145e97af1adb69ce';

const pulledRefs = new Set();

export function getDockerImage(platform) {
    return platform === 'linux/amd64' ? IMAGE_AMD64 : IMAGE;
}

export function getDockerContainerName(base) {
    return `${IMAGE_TAG}-${getContentHash(base)}`.replaceAll('/', '-').replaceAll(':', '-');
}

// `docker images -q` can't resolve digest refs; `inspect` handles both.
function isImagePresent(ref) {
    try {
        execFileSync('docker', ['image', 'inspect', ref], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

export default function pullDockerImage(platform) {
    const ref = getDockerImage(platform);
    if (pulledRefs.has(ref)) return;

    if (!isImagePresent(ref)) {
        console.log('');
        console.log('===========================================================');
        console.log('============= Downloading the docker image... =============');
        console.log('===========================================================');
        console.log('');
        execFileSync('docker', ['pull', ref], { stdio: 'inherit' });
        console.log('');
        console.log('===========================================================');
        console.log('');
    }

    pulledRefs.add(ref);
}
