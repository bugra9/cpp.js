import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import state from '../state/index.js';
import familyManifestOf from './familyManifest.js';
import { getDockerImage, imageRoleFor } from './pullDockerImage.js';
import { resolveWasiSdkPath } from './wasiToolchain.js';

// K4 (contract): -bin packages carry a machine-readable provenance block documenting
// the reproducible recipe of the shipped binaries - producing recipe package, upstream
// source hash and build environment. Everything is derived; nothing is hand-maintained.

// wasi-sdk's VERSION file pins the sdk release plus its wasi-libc/llvm inputs.
// Also consumed by the license machinery to pin toolchain-runtime notice links.
export function wasiToolchainIdentity(sdkPath) {
    const toolchain = { name: 'wasi-sdk' };
    const versionFile = `${sdkPath}/VERSION`;
    if (fs.existsSync(versionFile)) {
        const [version, ...pins] = fs.readFileSync(versionFile, 'utf8').trim().split('\n');
        toolchain.version = version.trim();
        for (const line of pins) {
            const match = line.match(/^([\w-]+):\s*(.+)$/);
            if (match) toolchain[match[1]] = match[2].trim();
        }
    }
    const clang = fs.realpathSync(`${sdkPath}/bin/clang`);
    toolchain.clangSha256 = crypto.createHash('sha256').update(fs.readFileSync(clang)).digest('hex');
    return toolchain;
}

export default function buildProvenance(target) {
    const manifest = state.config.package || {};
    const family = familyManifestOf(state.config);
    if (!family) {
        throw new Error(`crossbind: cannot resolve the family recipe package of "${manifest.name}" - required for provenance (contract K4).`);
    }
    const { getURL, sha256 } = state.config.build;
    if (!sha256) {
        throw new Error(`crossbind: the recipe of "${manifest.name}" declares no source sha256 - required for provenance (contract K4).`);
    }
    const wasiSdk = target.platform === 'wasi' ? resolveWasiSdkPath(state.config.system) : null;
    return {
        recipe: { name: family.manifest.name, version: family.manifest.version, nativeVersion: manifest.nativeVersion },
        source: { url: getURL(manifest.nativeVersion), sha256 },
        environment: {
            builder: wasiSdk ? 'host' : 'docker',
            // The digest-pinned image is the canonical reproduction environment either way.
            dockerImage: getDockerImage(imageRoleFor(target)),
            ...(wasiSdk ? { hostPlatform: `${os.platform()}-${os.arch()}`, toolchain: wasiToolchainIdentity(wasiSdk) } : {}),
        },
        // Full statically-linked component inventory with per-source hashes (contract E).
        sbom: `dist/prebuilt/${target.path}/sbom.cdx.json`,
    };
}
