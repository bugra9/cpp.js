import fr from 'follow-redirects';
import fs from 'fs';
import path from 'path';
import replace from 'replace';
import { execFileSync } from 'child_process';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import geosConfig from 'cppjs-package-geos/cppjs.config.js';
import projConfig from 'cppjs-package-proj/cppjs.config.js';
import sqlite3Config from 'cppjs-package-sqlite3/cppjs.config.js';
import zlibConfig from 'cppjs-package-zlib/cppjs.config.js';
import { mkdir } from 'node:fs/promises';

const VERSION = '5.1.0';
const url = `https://www.gaia-gis.it/gaia-sins/libspatialite-sources/libspatialite-${VERSION}.tar.gz`;

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
await decompress(`${compiler.config.paths.temp}/libspatialite-${VERSION}.tar.gz`, compiler.config.paths.temp, { plugins: [decompressTargz()] });

const workdirReal = `${compiler.config.paths.temp}/libspatialite-${VERSION}`;
const libdir = `${compiler.config.paths.output}/prebuilt/Android-arm64-v8a`;
await mkdir(libdir, { recursive: true });

replace({
    regex: '-lpthread', replacement: '', paths: [`${workdirReal}/configure`, `${workdirReal}/configure.ac`, `${workdirReal}/src/Makefile.in`, `${workdirReal}/src/Makefile.am`], recursive: false, silent: true,
});

fs.cpSync(`${compiler.config.paths.project}/config.sub`, `${workdirReal}/config.sub`);

const geosPath = `${getPathInfo(geosConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const projPath = `${getPathInfo(projConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const sqlite3Path = `${getPathInfo(sqlite3Config.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const iconvPath = '/home/bugra/Documents/MiniProject/cpp.js/packages/iconv/dist/prebuilt/Android-arm64-v8a';

const CROSSCOMPILER = 'aarch64-linux-android33';
const ANDROID_NDK = '/home/bugra/Documents/App/Android/Sdk/ndk/25.2.9519653';
const t = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64/bin`;
const t2 = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64`;

const options = {
    cwd: `${compiler.config.paths.temp}/libspatialite-${VERSION}`,
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
    `--prefix=${libdir}`, '--host=aarch64-linux-android',
    `SQLITE3_CFLAGS=-I${sqlite3Path}/include`, `SQLITE3_LIBS=-L${sqlite3Path}/lib`, `--with-geosconfig=${geosPath}/bin/geos-config`,
    '--enable-geosadvanced=yes', '--enable-geopackage=yes', '--enable-examples=no', '--enable-minizip=no',
    '--enable-libxml2=no', '--disable-rttopo', '--enable-freexl=no',
    `CFLAGS=${cFlags} -I${iconvPath}/include`, `CPPFLAGS=${cFlags} -I${iconvPath}/include`, `LDFLAGS=${ldFlags} -L${iconvPath}/lib -lstdc++ -lsqlite3 -lm -ltiff -lgeos -lcharset`,
], options);
execFileSync('make', ['-j4', 'install'], options);
