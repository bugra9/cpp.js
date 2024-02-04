import https from 'https';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import { mkdir } from 'node:fs/promises';

const VERSION = '1.3';
const url = `https://zlib.net/zlib-${VERSION}.tar.gz`;

function downloadFile(url, folder) {
    return new Promise((resolve) => {
        const filename = path.basename(url);

        https.get(url, (res) => {
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
await decompress(`${compiler.config.paths.temp}/zlib-${VERSION}.tar.gz`, compiler.config.paths.temp, { plugins: [decompressTargz()] });

const libdir = `${compiler.config.paths.output}/prebuilt/Android-arm64-v8a`;

await mkdir(libdir, { recursive: true });

const CROSSCOMPILER = 'aarch64-linux-android33';
const ANDROID_NDK = '/home/bugra/Documents/App/Android/Sdk/ndk/25.2.9519653';
const t = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64/bin`;
const t2 = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64`;

const options = {
    cwd: `${compiler.config.paths.temp}/zlib-${VERSION}`,
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
console.log(options);
execFileSync('./configure', [`--prefix=${libdir}`, '--static'], options);
execFileSync('make', ['-j4', 'install'], options);

// fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
