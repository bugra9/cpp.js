import { execFileSync } from 'node:child_process';
import { getContentHash } from './hash.js';

// Digest-pinned so a re-pushed tag can't swap the compiler; IMAGE_TAG only names containers - bump all pins via scripts/pin-docker-image.js.
const IMAGE_TAG = 'bugra9/cpp.js:0.3.5';
const IMAGE = 'bugra9/cpp.js@sha256:044eee6f4dd55e1f3e88a92f075cba40d3eaa8447f18a30d6408156282fee8f1';
// amd64 leaf of the same index: android must run x86_64 (NDK), and the classic image store holds one platform per digest ref.
const IMAGE_AMD64 = 'bugra9/cpp.js@sha256:fc318dfb1f3884b30f0b7045d9bd4bb73b923ae70822e5ac145e97af1adb69ce';

// One entry per role in the image family. Both still resolve to the monolith that carries every
// toolchain, so publishing base/web/android is a data change here rather than a code change.
const IMAGES = {
    web: { ref: IMAGE, amd64: IMAGE_AMD64 },
    android: { ref: IMAGE, amd64: IMAGE_AMD64 },
};

const OVERRIDE_KEYS = { web: 'CROSSBIND_IMAGE_WEB', android: 'CROSSBIND_IMAGE_ANDROID' };

// Which image a target compiles in: wasm and wasi share the web image, ios never reaches docker.
export function imageRoleFor(target) {
    return target?.platform === 'android' ? 'android' : 'web';
}

const warned = new Set();
function warnOnce(message) {
    if (warned.has(message)) return;
    warned.add(message);
    console.warn(message);
}

// An override is one of three distinct situations, and only the first keeps the reproducibility
// guarantee: same digest from another registry, a digest the release does not ship, or a bare tag.
function resolveRef(role, expected) {
    const key = OVERRIDE_KEYS[role];
    const explicit = process.env[key];
    if (explicit) {
        if (explicit !== expected) {
            warnOnce(explicit.includes('@sha256:')
                ? `crossbind: unsupported toolchain override - ${key} pins a digest the release does not ship (${explicit}).`
                : `crossbind: mutable override - ${key} names the tag ${explicit}; the reproducibility guarantee is disabled.`);
        }
        return explicit;
    }

    const mirror = process.env.CROSSBIND_REGISTRY_MIRROR;
    const at = expected.indexOf('@');
    if (mirror && at !== -1) {
        warnOnce(`crossbind: pulling from the registry mirror ${mirror} (same digest as the release).`);
        return `${mirror.replace(/\/+$/, '')}/${expected.slice(0, at).split('/').pop()}${expected.slice(at)}`;
    }
    return expected;
}

export function getDockerImage(role = 'web', platform) {
    const image = IMAGES[role];
    if (!image) throw new Error(`crossbind: unknown docker image role "${role}".`);
    return resolveRef(role, platform === 'linux/amd64' ? image.amd64 : image.ref);
}

// One container per image: a web container carries no NDK, and android runs a forced platform.
export function getDockerContainerName(base, role = 'web') {
    return `${IMAGE_TAG}-${role}-${getContentHash(base)}`.replaceAll('/', '-').replaceAll(':', '-');
}

const pulledRefs = new Set();

// `docker images -q` can't resolve digest refs; `inspect` handles both.
function isImagePresent(ref) {
    try {
        execFileSync('docker', ['image', 'inspect', ref], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

export default function pullDockerImage(role = 'web', platform) {
    const ref = getDockerImage(role, platform);
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
