import fr from 'follow-redirects';
import fs from 'fs';
import path from 'path';
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

const tempPath = `/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;
const workdir = `${tempPath}/gdal-${VERSION}`;
const workdirReal = `${compiler.config.paths.temp}/gdal-${VERSION}`;
const libdir = `${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/Emscripten-x86_64`;

fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });

replace({
    regex: ' iconv_open', replacement: ' libiconv_open', paths: [`${workdirReal}/port/cpl_recode_iconv.cpp`], recursive: false, silent: true,
});

replace({
    regex: '        iconv', replacement: '        libiconv', paths: [`${workdirReal}/port/cpl_recode_iconv.cpp`], recursive: false, silent: true,
});

replace({
    regex: '#include <iconv.h>', replacement: '# include <iconv.h>\nextern "C" {\n    extern __attribute__((__visibility__("default"))) iconv_t libiconv_open (const char* tocode, const char* fromcode);\n    extern __attribute__((__visibility__("default"))) size_t libiconv (iconv_t cd,  char* * inbuf, size_t *inbytesleft, char* * outbuf, size_t *outbytesleft);\n}', paths: [`${workdirReal}/port/cpl_recode_iconv.cpp`], recursive: false, silent: true,
});

const expatPath = `/live/${getPathInfo(expatConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const geosPath = `/live/${getPathInfo(geosConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const geotiffPath = `/live/${getPathInfo(geotiffConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const iconvPath = `/live/${getPathInfo(iconvConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const projPath = `/live/${getPathInfo(projConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const spatialitePath = `/live/${getPathInfo(spatialiteConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const sqlite3Path = `/live/${getPathInfo(sqlite3Config.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const tiffPath = `/live/${getPathInfo(tiffConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const webpPath = `/live/${getPathInfo(webpConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const zlibPath = `/live/${getPathInfo(zlibConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;

compiler.run('emcmake', [
    'cmake', '.', `-DCMAKE_INSTALL_PREFIX=/live/${libdir}`, '-DBUILD_SHARED_LIBS=OFF', '-DCMAKE_BUILD_TYPE=Release',
    `-DCMAKE_PREFIX_PATH=/live/${libdir}`, `-DCMAKE_FIND_ROOT_PATH=/live/${libdir}`,
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
], { workdir, console: true });
compiler.run('emmake', ['make', '-j4', 'install'], { workdir, console: true });

const distCmakeContent = fs.readFileSync(`${compiler.config.paths.cli}/assets/dist.cmake`, { encoding: 'utf8', flag: 'r' })
    .replace('___PROJECT_NAME___', compiler.config.general.name);
fs.writeFileSync(`${compiler.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);
fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
