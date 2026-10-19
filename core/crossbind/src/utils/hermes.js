import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import withDirLock from './dirLock.js';
import downloadAndExtractFile from './downloadAndExtractFile.js';

// The Hermes React Native publishes on Maven Central for Apple platforms: the macOS framework, the iOS xcframework,
// hermesc and the headers. A new version also moves third_party/jsi of @crossbind/core-app-host to its tag, and the
// Hermes of crossbind's android-app and linux images.
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

// Linux has no published Hermes, so crossbind's linux image builds the release's source, with its static libc++: JSI
// hands std types across, and the host and the project's archives build there too.
export const HERMES_SOURCE = {
    url: `https://github.com/facebook/hermes/archive/refs/tags/hermes-v${HERMES.version}.tar.gz`,
    sha256: '37e91915c67ce0c457f69b2de00fcaf28fcf755ab7de6e4f33f1d6ee9efcffed',
};

// Android's Hermes is React Native's AAR, which an app's Gradle build takes for the libraries it packages, and which
// crossbind's android-app image holds, with its headers and hermesc, for the app's host.
export const HERMES_ANDROID = {
    url: `https://repo1.maven.org/maven2/com/facebook/hermes/hermes-android/${HERMES.version}/hermes-android-${HERMES.version}-release.aar`,
    sha256: '6fb440b29aadb5925bed1109338da61623c54c3508020bb2cecebcaaa80e53b8',
};
