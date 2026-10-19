import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import withDirLock from './dirLock.js';
import downloadAndExtractFile from './downloadAndExtractFile.js';
import runInLinuxImage from './linuxImage.js';
import logger from './logger.js';

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

// Linux has no published Hermes, so the release's source builds once per machine and arch in crossbind's linux image,
// with the image's static libc++: JSI hands std types across, and the host and the project's archives build there too.
export const HERMES_SOURCE = {
    url: `https://github.com/facebook/hermes/archive/refs/tags/hermes-v${HERMES.version}.tar.gz`,
    sha256: '37e91915c67ce0c457f69b2de00fcaf28fcf755ab7de6e4f33f1d6ee9efcffed',
};

const LINUX_TRIPLES = { x64: 'x86_64-linux-gnu', arm64: 'aarch64-linux-gnu' };

// Host tools first, whose hermesc the cross build runs, then the static VM, laid out as the Apple release: include/,
// lib/ and a hermesc for the image.
const LINUX_BUILD = `set -eu
S=$1; WORK=$2; TRIPLE=$3; OUT=$4
JOBS=$(nproc)
FLAGS="-DCMAKE_BUILD_TYPE=Release -DHERMES_ENABLE_TEST_SUITE=OFF -DHERMES_ENABLE_INTL=OFF -DHERMES_UNICODE_LITE=ON -DHERMES_ENABLE_DEBUGGER=OFF"
HOST=$WORK/host-$(uname -m)
if [ ! -x "$HOST/bin/hermesc" ]; then
    cmake -S "$S" -B "$HOST" -G "Unix Makefiles" $FLAGS
    cmake --build "$HOST" --target hermesc shermes -- -j"$JOBS"
fi
B=$WORK/$TRIPLE
cmake -S "$S" -B "$B" -G "Unix Makefiles" $FLAGS -DHERMES_ENABLE_TOOLS=OFF \\
    -DCMAKE_TOOLCHAIN_FILE="/opt/crossbind/linux/$TRIPLE.cmake" -DIMPORT_HOST_COMPILERS="$HOST/ImportHostCompilers.cmake"
cmake --build "$B" --target hermesvm_a -- -j"$JOBS"
mkdir -p "$OUT/lib" "$OUT/include/hermes" "$OUT/include/jsi" "$OUT/bin"
cp "$B/lib/libhermesvm_a.a" "$OUT/lib/"
cp "$(find "$B/external" -name libboost_context.a | head -n 1)" "$OUT/lib/"
(cd "$S/API/hermes" && find . -name '*.h' -exec cp --parents {} "$OUT/include/hermes/" \\;)
(cd "$S/public/hermes" && find . -name '*.h' -exec cp --parents {} "$OUT/include/hermes/" \\;)
cp "$S/API/jsi/jsi/"*.h "$OUT/include/jsi/"
cp "$HOST/bin/hermesc" "$OUT/bin/"
touch "$OUT/.complete"
`;

export async function resolveLinuxHermes(arch) {
    const root = hermesDir();
    const out = path.join(root, `linux-${arch}`);
    fs.mkdirSync(root, { recursive: true });
    // One build at a time, as the arches share the host tools.
    await withDirLock(path.join(root, 'linux.lock'), async () => {
        if (fs.existsSync(path.join(out, '.complete'))) return;
        await downloadAndExtractFile(HERMES_SOURCE.url, path.join(root, 'linux'), HERMES_SOURCE.sha256);
        logger.info(`crossbind: building Hermes ${HERMES.version} for linux-${arch}, once on this machine: a few minutes`);
        runInLinuxImage(LINUX_BUILD, {
            mounts: [[root, '/hermes']],
            args: ['/hermes/linux/source', '/hermes/linux/build', LINUX_TRIPLES[arch], `/hermes/linux-${arch}`],
            what: `building Hermes for linux-${arch}`,
        });
    });
    return out;
}
