import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import withDirLock from './dirLock.js';
import downloadAndExtractFile from './downloadAndExtractFile.js';

// The Hermes React Native publishes on Maven Central for Apple platforms: the macOS framework, the iOS xcframework,
// hermesc and the headers. A new version also moves third_party/jsi of @crossbind/core-app-host to its tag.
export const HERMES = {
    version: '250829098.0.17',
    sha256: '2967ee51b41bd433b3027dda875e96194354e2b4d715f9f186fd0c04ccef309d',
    license: 'MIT',
};

export const hermesUrl = (version) => `https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/${version}/hermes-ios-${version}-hermes-ios-release.tar.gz`;

export const hermesDir = () => path.join(os.homedir(), '.crossbind', 'hermes', HERMES.version);

// The release's destroot, downloaded once and checked against the pinned sha256.
export default async function resolveHermes() {
    const dir = hermesDir();
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    await withDirLock(`${dir}.lock`, () => downloadAndExtractFile(hermesUrl(HERMES.version), dir, HERMES.sha256));
    return `${dir}/source/destroot`;
}
