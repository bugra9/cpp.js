import fr from 'follow-redirects';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import { mkdir } from 'node:fs/promises';

const VERSION = '3.12.1';
const url = `https://download.osgeo.org/geos/geos-${VERSION}.tar.bz2`;

function downloadFile(url, folder) {
    return new Promise((resolve) => {
        const filename = path.basename(url);

        fr.https.get(url, (res) => {
            const fileStream = fs.createWriteStream(`${folder}/${filename}`);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
        });
    });
}

const compiler = new CppjsCompiler();

await downloadFile(url, compiler.config.paths.temp);
await decompress(`${compiler.config.paths.temp}/geos-${VERSION}.tar.bz2`, compiler.config.paths.temp);

const libdir = `${compiler.config.paths.output}/prebuilt/Android-arm64-v8a`;
await mkdir(libdir, { recursive: true });

const ANDROID_NDK = '/home/bugra/Documents/App/Android/Sdk/ndk/25.2.9519653';

const options = {
    cwd: `${compiler.config.paths.temp}/geos-${VERSION}`,
    stdio: 'inherit',
};

execFileSync('cmake', [
    '.', `-DCMAKE_INSTALL_PREFIX=${libdir}`, '-DCMAKE_BUILD_TYPE=Release',
    '-DCMAKE_SYSTEM_NAME=Android', '-DCMAKE_SYSTEM_VERSION=33', '-DCMAKE_ANDROID_ARCH_ABI=arm64-v8a',
    `-DCMAKE_ANDROID_NDK=${ANDROID_NDK}`,
    '-DBUILD_TESTING=OFF',
], options);
execFileSync('make', ['-j4', 'install'], options);
