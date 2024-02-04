import fr from 'follow-redirects';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import projConfig from 'cppjs-package-proj/cppjs.config.js';
import tiffConfig from 'cppjs-package-tiff/cppjs.config.js';
import zlibConfig from 'cppjs-package-zlib/cppjs.config.js';
import { mkdir } from 'node:fs/promises';

const VERSION = '1.7.1';
const url = `https://download.osgeo.org/geotiff/libgeotiff/libgeotiff-${VERSION}.tar.gz`;

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
await decompress(`${compiler.config.paths.temp}/libgeotiff-${VERSION}.tar.gz`, compiler.config.paths.temp, { plugins: [decompressTargz()] });

const libdir = `${compiler.config.paths.output}/prebuilt/Android-arm64-v8a`;
await mkdir(libdir, { recursive: true });

const projPath = `${getPathInfo(projConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const tiffPath = `${getPathInfo(tiffConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const zlibPath = `${getPathInfo(zlibConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;

const CROSSCOMPILER = 'aarch64-linux-android33';
const ANDROID_NDK = '/home/bugra/Documents/App/Android/Sdk/ndk/25.2.9519653';
const t = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64/bin`;
const t2 = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64`;

const options = {
    cwd: `${compiler.config.paths.temp}/libgeotiff-${VERSION}`,
    stdio: 'inherit',
    env: {
        ...process.env,
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
const allDeps = compiler.config.getAllDependencies();
const cFlags = allDeps.map((d) => `-I${d.paths.project}/dist/prebuilt/Android-arm64-v8a/include`).join(' ');
const ldFlags = allDeps.map((d) => `-L${d.paths.project}/dist/prebuilt/Android-arm64-v8a/lib`).join(' ');

execFileSync('./configure', [
    `--prefix=${libdir}`, '--enable-shared=no', '--host=aarch64-linux-android',
    `--with-proj=${projPath}`, `--with-libtiff=${tiffPath}`, `--with-zlib=${zlibPath}`,
    `CFLAGS=${cFlags}`, `CPPFLAGS=${cFlags}`, `LDFLAGS=${ldFlags} -lstdc++`,
], options);
execFileSync('make', ['-j4', 'install'], options);
