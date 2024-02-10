import fr from 'follow-redirects';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import tiffConfig from 'cppjs-package-tiff/cppjs.config.js';
import sqlite3Config from 'cppjs-package-sqlite3/cppjs.config.js';
import { mkdir } from 'node:fs/promises';

const VERSION = '9.3.1';
const url = `https://download.osgeo.org/proj/proj-${VERSION}.tar.gz`;

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
await decompress(`${compiler.config.paths.temp}/proj-${VERSION}.tar.gz`, compiler.config.paths.temp, { plugins: [decompressTargz()] });

const libdir = `${compiler.config.paths.output}/prebuilt/Android-arm64-v8a`;
await mkdir(libdir, { recursive: true });

const tiffPath = `${getPathInfo(tiffConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const sqlite3Path = `${getPathInfo(sqlite3Config.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;

const ANDROID_NDK = '/home/bugra/Documents/App/Android/Sdk/ndk/25.2.9519653';
const options = {
    cwd: `${compiler.config.paths.temp}/proj-${VERSION}`,
};

execFileSync('cmake', [
    '.', `-DCMAKE_INSTALL_PREFIX=${libdir}`,
    '-DENABLE_CURL=OFF', '-DBUILD_TESTING=OFF', '-DBUILD_APPS=OFF',
    '-DCMAKE_SYSTEM_NAME=Android', '-DCMAKE_SYSTEM_VERSION=33', '-DCMAKE_ANDROID_ARCH_ABI=arm64-v8a',
    `-DCMAKE_ANDROID_NDK=${ANDROID_NDK}`,
    `-DSQLITE3_INCLUDE_DIR=${sqlite3Path}/include`, `-DSQLITE3_LIBRARY=${sqlite3Path}/lib/libsqlite3.so`,
    `-DTIFF_INCLUDE_DIR=${tiffPath}/include`, `-DTIFF_LIBRARY_RELEASE=${tiffPath}/lib/libtiff.so`,
], options);
execFileSync('make', ['-j4', 'install'], options);
