import fr from 'follow-redirects';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import replace from 'replace';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import expatConfig from 'cppjs-package-expat/cppjs.config.js';
import geosConfig from 'cppjs-package-geos/cppjs.config.js';
import geotiffConfig from 'cppjs-package-geotiff/cppjs.config.js';
import iconvConfig from 'cppjs-package-iconv/cppjs.config.js';
import projConfig from 'cppjs-package-proj/cppjs.config.js';
import spatialiteConfig from 'cppjs-package-spatialite/cppjs.config.js';
import sqlite3Config from 'cppjs-package-sqlite3/cppjs.config.js';
import tiffConfig from 'cppjs-package-tiff/cppjs.config.js';
import webpConfig from 'cppjs-package-webp/cppjs.config.js';
import zlibConfig from 'cppjs-package-zlib/cppjs.config.js';
import { mkdir } from 'node:fs/promises';

const VERSION = '3.8.1';
const url = `https://github.com/OSGeo/gdal/releases/download/v${VERSION}/gdal-${VERSION}.tar.gz`;

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
await decompress(`${compiler.config.paths.temp}/gdal-${VERSION}.tar.gz`, compiler.config.paths.temp, { plugins: [decompressTargz()] });

const workdirReal = `${compiler.config.paths.temp}/gdal-${VERSION}`;
const libdir = `${compiler.config.paths.output}/prebuilt/Android-arm64-v8a`;
await mkdir(libdir, { recursive: true });

replace({
    regex: ' iconv_open', replacement: ' libiconv_open', paths: [`${workdirReal}/port/cpl_recode_iconv.cpp`], recursive: false, silent: true,
});

replace({
    regex: '        iconv', replacement: '        libiconv', paths: [`${workdirReal}/port/cpl_recode_iconv.cpp`], recursive: false, silent: true,
});

replace({
    regex: '#include <iconv.h>', replacement: '# include <iconv.h>\nextern "C" {\n    extern __attribute__((__visibility__("default"))) iconv_t libiconv_open (const char* tocode, const char* fromcode);\n    extern __attribute__((__visibility__("default"))) size_t libiconv (iconv_t cd,  char* * inbuf, size_t *inbytesleft, char* * outbuf, size_t *outbytesleft);\n}', paths: [`${workdirReal}/port/cpl_recode_iconv.cpp`], recursive: false, silent: true,
});

const expatPath = `${getPathInfo(expatConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const geosPath = `${getPathInfo(geosConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const geotiffPath = `${getPathInfo(geotiffConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const iconvPath = `${getPathInfo(iconvConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const projPath = `${getPathInfo(projConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const spatialitePath = `${getPathInfo(spatialiteConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const sqlite3Path = `${getPathInfo(sqlite3Config.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const tiffPath = `${getPathInfo(tiffConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const webpPath = `${getPathInfo(webpConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;
const zlibPath = `${getPathInfo(zlibConfig.paths.project, compiler.config.paths.base).absolute}/dist/prebuilt/Android-arm64-v8a`;

const CROSSCOMPILER = 'aarch64-linux-android33';
const ANDROID_NDK = '/home/bugra/Documents/App/Android/Sdk/ndk/25.2.9519653';
const t = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64/bin`;
const t2 = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64`;

const options = {
    cwd: `${compiler.config.paths.temp}/gdal-${VERSION}`,
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

execFileSync('cmake', [
    '.', `-DCMAKE_INSTALL_PREFIX=${libdir}`, '-DBUILD_SHARED_LIBS=OFF', '-DCMAKE_BUILD_TYPE=Release',
    `-DCMAKE_PREFIX_PATH=${libdir}`, `-DCMAKE_FIND_ROOT_PATH=${libdir}`, '-DACCEPT_MISSING_SQLITE3_RTREE=ON',
    '-DBUILD_APPS=OFF', '-DGDAL_ENABLE_DRIVER_PDS=OFF',
    '-DGDAL_USE_HDF5=OFF', '-DGDAL_USE_HDFS=OFF', '-DACCEPT_MISSING_SQLITE3_MUTEX_ALLOC=ON',
    `-DSQLite3_INCLUDE_DIR=${sqlite3Path}/include`, `-DSQLite3_LIBRARY=${sqlite3Path}/lib/libsqlite3.a`,
    `-DPROJ_INCLUDE_DIR=${projPath}/include`, `-DPROJ_LIBRARY_RELEASE=${projPath}/lib/libproj.a`,
    `-DTIFF_INCLUDE_DIR=${tiffPath}/include`, `-DTIFF_LIBRARY_RELEASE=${tiffPath}/lib/libtiff.a`,
    `-DGEOTIFF_INCLUDE_DIR=${geotiffPath}/include`, `-DGEOTIFF_LIBRARY_RELEASE=${geotiffPath}/lib/libgeotiff.a`,
    `-DZLIB_INCLUDE_DIR=${zlibPath}/include`, `-DZLIB_LIBRARY_RELEASE=${zlibPath}/lib/libz.a`,
    `-DSPATIALITE_INCLUDE_DIR=${spatialitePath}/include`, `-DSPATIALITE_LIBRARY=${spatialitePath}/lib/libspatialite.a`,
    `-DGEOS_INCLUDE_DIR=${geosPath}/include`, `-DGEOS_LIBRARY=${geosPath}/lib/libgeos.a`,
    `-DWEBP_INCLUDE_DIR=${webpPath}/include`, `-DWEBP_LIBRARY=${webpPath}/lib/libwebp.a`,
    `-DEXPAT_INCLUDE_DIR=${expatPath}/include`, `-DEXPAT_LIBRARY=${expatPath}/lib/libexpat.a`,
    `-DIconv_INCLUDE_DIR=${iconvPath}/include`, `-DIconv_LIBRARY=${iconvPath}/lib/libiconv.a`,
    '-DCMAKE_SYSTEM_NAME=Android',
    '-DCMAKE_SYSTEM_VERSION=33',
    '-DCMAKE_ANDROID_ARCH_ABI=arm64-v8a',
    `-DCMAKE_ANDROID_NDK=${ANDROID_NDK}`,
    '-DCMAKE_ANDROID_STL_TYPE=c++_static',
], options);
execFileSync('make', ['-j4', 'install'], options);
