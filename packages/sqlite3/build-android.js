import fr from 'follow-redirects';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import zlibConfig from 'cppjs-package-zlib/cppjs.config.js';
import { mkdir } from 'node:fs/promises';

const VERSION = '3440200';
const url = `https://www.sqlite.org/2023/sqlite-autoconf-${VERSION}.tar.gz`;

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
await decompress(`${compiler.config.paths.temp}/sqlite-autoconf-${VERSION}.tar.gz`, compiler.config.paths.temp, { plugins: [decompressTargz()] });

const libdir = `${compiler.config.paths.output}/prebuilt/Android-arm64-v8a`;
await mkdir(libdir, { recursive: true });

const zlibPath = `${getPathInfo(zlibConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;

const CROSSCOMPILER = 'aarch64-linux-android33';
const ANDROID_NDK = '/home/bugra/Documents/App/Android/Sdk/ndk/25.2.9519653';
const t = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64/bin`;
const t2 = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64`;

const options = {
    cwd: `${compiler.config.paths.temp}/sqlite-autoconf-${VERSION}`,
    stdio: 'inherit',
    env: {
        AR: `${t}/llvm-ar`,
        AS: `${t}/llvm-as`,
        CC: `${t}/${CROSSCOMPILER}-clang`,
        CXX: `${t}/${CROSSCOMPILER}-clang++`,
        LD: `${t}/ld`,
        RANLIB: `${t}/llvm-ranlib`,
        STRIP: `${t}/llvm-strip`,
        NM: `${t}/llvm-nm`,
        CFLAGS: `--sysroot=${t2}/sysroot`,
    },
};

execFileSync('./configure', [
    `--prefix=${libdir}`, '--enable-shared=no', '--host=aarch64-linux-android',
    `CFLAGS=-I${zlibPath}/include -DSQLITE_DISABLE_LFS -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS -DSQLITE_ENABLE_JSON1 -DSQLITE_THREADSAFE=0 -DSQLITE_ENABLE_NORMALIZE`,
    `CPPFLAGS=-I${zlibPath}/include`, `LDFLAGS=-L${zlibPath}/lib`,
], options);
execFileSync('make', ['-j4', 'install'], options);
