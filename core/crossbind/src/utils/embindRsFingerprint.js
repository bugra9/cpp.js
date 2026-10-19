import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { getContentHash, getFileHash } from './hash.js';
import { collectRustSources } from './inputStamp.js';
import resolveEmbindRustRoot from './resolveEmbindRust.js';
import { HOST_BUILT_PLATFORMS } from './targets.js';

const { toolchains } = createRequire(import.meta.url)('../assets/toolchain-digests.json');

// Every cargo staticlib bundles the embind-rs it was built from. An archive from another one links stale glue, and next
// to an archive built after it every embind_rs symbol is defined twice, so a prebuilt records the one it came from.
export const EMBIND_RS_FINGERPRINT_FILE = 'crossbind-embind-rs.fingerprint';

// Paths count relative to the crate, so an archive built from the same embind-rs elsewhere matches. An archive an image
// built carries that image's Rust std too, whose second copy from another rustc lld refuses, so the image's rustc
// counts as well; Apple's linker takes the mix, and the host's own rustc builds those.
export function getEmbindRsFingerprint(target) {
    const crate = `${resolveEmbindRustRoot()}/crate`;
    const files = [...collectRustSources([crate]), `${crate}/Cargo.toml`];
    const embindRs = getContentHash(files.map((file) => `${path.relative(crate, file)}:${getFileHash(file)}`).sort().join('\n'));
    return !target || HOST_BUILT_PLATFORMS.includes(target.platform) ? embindRs : getContentHash(`${embindRs}\nrustc ${toolchains.rust}`);
}

export function isEmbindRsFingerprintStale(prebuiltDir, fingerprint) {
    const file = `${prebuiltDir}/${EMBIND_RS_FINGERPRINT_FILE}`;
    return !fs.existsSync(file) || fs.readFileSync(file, { encoding: 'utf8' }) !== fingerprint;
}

export function writeEmbindRsFingerprint(prebuiltDir, fingerprint) {
    fs.mkdirSync(prebuiltDir, { recursive: true });
    fs.writeFileSync(`${prebuiltDir}/${EMBIND_RS_FINGERPRINT_FILE}`, fingerprint);
}
