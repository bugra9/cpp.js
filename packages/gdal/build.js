import fr from 'follow-redirects';
import os from 'os';
import fs from 'fs';
import path from 'path';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import replace from 'replace';
import { mkdir } from 'node:fs/promises';
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

const cpuCount = os.cpus().length - 1;

const VERSION = '3.8.5';
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

const compiler2 = new CppjsCompiler();
await downloadFile(url, compiler2.config.paths.temp);
await mkdir(`${compiler2.config.paths.output}/prebuilt`, { recursive: true });
const distCmakeContent = fs.readFileSync(`${compiler2.config.paths.cli}/assets/dist.cmake`, { encoding: 'utf8', flag: 'r' })
    .replace('___PROJECT_NAME___', compiler2.config.general.name).replace('___PROJECT_LIBS___', compiler2.config.export.libName.join(';'));
fs.writeFileSync(`${compiler2.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);

const promises = [];
compiler2.getAllPlatforms().forEach((platform) => {
    if (fs.existsSync(`${compiler2.config.paths.output}/prebuilt/${platform}/lib`)) return;
    const job = async () => {
        const compiler = new CppjsCompiler(platform);
        await decompress(`${compiler2.config.paths.temp}/gdal-${VERSION}.tar.gz`, compiler.config.paths.temp, { plugins: [decompressTargz()] });

        const tempPath = `/tmp/cppjs/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;
        const workdir = `${tempPath}/gdal-${VERSION}/cppjs`;
        const workdirReal = `${compiler.config.paths.temp}/gdal-${VERSION}`;
        const libdir = `${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/${platform}`;

        // fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });
        await mkdir(`${compiler.config.paths.output}/prebuilt/${platform}/swig`, { recursive: true });
        await mkdir(workdir, { recursive: true });

        replace({
            regex: ' iconv_open', replacement: ' libiconv_open', paths: [`${workdirReal}/port/cpl_recode_iconv.cpp`], recursive: false, silent: true,
        });
        replace({
            regex: '        iconv', replacement: '        libiconv', paths: [`${workdirReal}/port/cpl_recode_iconv.cpp`], recursive: false, silent: true,
        });
        replace({
            regex: '#include <iconv.h>', replacement: '# include <iconv.h>\nextern "C" {\n    extern __attribute__((__visibility__("default"))) iconv_t libiconv_open (const char* tocode, const char* fromcode);\n    extern __attribute__((__visibility__("default"))) size_t libiconv (iconv_t cd,  char* * inbuf, size_t *inbytesleft, char* * outbuf, size_t *outbytesleft);\n}', paths: [`${workdirReal}/port/cpl_recode_iconv.cpp`], recursive: false, silent: true,
        });
        replace({
            regex: '  add_subdirectory\\(swig\\)', replacement: '', paths: [`${workdirReal}/gdal.cmake`], recursive: false, silent: true,
        });

        const expatPath = `/tmp/cppjs/live/${getPathInfo(expatConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;
        const geosPath = `/tmp/cppjs/live/${getPathInfo(geosConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;
        const geotiffPath = `/tmp/cppjs/live/${getPathInfo(geotiffConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;
        const iconvPath = `/tmp/cppjs/live/${getPathInfo(iconvConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;
        const projPath = `/tmp/cppjs/live/${getPathInfo(projConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;
        const spatialitePath = `/tmp/cppjs/live/${getPathInfo(spatialiteConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;
        const sqlite3Path = `/tmp/cppjs/live/${getPathInfo(sqlite3Config.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;
        const tiffPath = `/tmp/cppjs/live/${getPathInfo(tiffConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;
        const webpPath = `/tmp/cppjs/live/${getPathInfo(webpConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;
        const zlibPath = `/tmp/cppjs/live/${getPathInfo(zlibConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;

        const basePlatform = platform.split('-', 1)[0];
        let platformParams = [];
        let ext;
        switch (platform) {
            case 'Emscripten-x86_64':
                platformParams = ['-DBUILD_SHARED_LIBS=OFF'];
                ext = 'a';
                break;
            case 'Android-arm64-v8a':
                platformParams = ['-DCMAKE_ANDROID_STL_TYPE=c++_shared'];
                ext = 'so';
                break;
            case 'iOS-iphoneos':
                platformParams = [];
                ext = 'a';
                break;
            case 'iOS-iphonesimulator':
                platformParams = [];
                ext = 'a';
                break;
            default:
        }

        compiler.run(null, [
            basePlatform === 'iOS' ? 'ios-cmake' : 'cmake', '..', `-DCMAKE_INSTALL_PREFIX=/tmp/cppjs/live/${libdir}`, '-DCMAKE_BUILD_TYPE=Release', ...platformParams,
            `-DCMAKE_PREFIX_PATH=/tmp/cppjs/live/${libdir}`, `-DCMAKE_FIND_ROOT_PATH=/tmp/cppjs/live/${libdir}`,
            '-DBUILD_APPS=OFF', '-DGDAL_ENABLE_DRIVER_PDS=OFF', '-DBUILD_TESTING=OFF', '-DGDAL_USE_ZSTD=OFF',
            '-DGDAL_USE_HDF5=OFF', '-DGDAL_USE_HDFS=OFF', '-DACCEPT_MISSING_SQLITE3_MUTEX_ALLOC=ON',
            `-DSQLite3_INCLUDE_DIR=${sqlite3Path}/include`, `-DSQLite3_LIBRARY=${sqlite3Path}/lib/libsqlite3.${ext}`,
            `-DPROJ_INCLUDE_DIR=${projPath}/include`, `-DPROJ_LIBRARY_RELEASE=${projPath}/lib/libproj.${ext}`,
            `-DTIFF_INCLUDE_DIR=${tiffPath}/include`, `-DTIFF_LIBRARY_RELEASE=${tiffPath}/lib/libtiff.${ext}`,
            `-DGEOTIFF_INCLUDE_DIR=${geotiffPath}/include`, `-DGEOTIFF_LIBRARY_RELEASE=${geotiffPath}/lib/libgeotiff.${ext}`,
            `-DZLIB_INCLUDE_DIR=${zlibPath}/include`, `-DZLIB_LIBRARY_RELEASE=${zlibPath}/lib/libz.${ext}`,
            `-DSPATIALITE_INCLUDE_DIR=${spatialitePath}/include`, `-DSPATIALITE_LIBRARY=${spatialitePath}/lib/libspatialite.${ext}`,
            `-DGEOS_INCLUDE_DIR=${geosPath}/include`, `-DGEOS_LIBRARY=${geosPath}/lib/libgeos_c.${ext}`,
            `-DWEBP_INCLUDE_DIR=${webpPath}/include`, `-DWEBP_LIBRARY=${webpPath}/lib/libwebp.${ext}`,
            `-DEXPAT_INCLUDE_DIR=${expatPath}/include`, `-DEXPAT_LIBRARY=${expatPath}/lib/libexpat.${ext}`,
            `-DIconv_INCLUDE_DIR=${iconvPath}/include`, `-DIconv_LIBRARY=${iconvPath}/lib/libiconv.${ext}`,
        ], { workdir, console: true });
        compiler.run(null, [basePlatform === 'iOS' ? 'ios-cmake' : 'cmake', '--build', '.', '--config', 'Release', '--target', 'install'], { workdir, console: true });

        fs.copyFileSync(`${compiler.config.paths.project}/assets/Gdal.i`, `${compiler.config.paths.output}/prebuilt/${platform}/swig/Gdal.i`);
        fs.copyFileSync(`${compiler.config.paths.project}/assets/gdalcpp.h`, `${compiler.config.paths.output}/prebuilt/${platform}/include/gdalcpp.h`);
        fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
    };
    promises.push(job());
});

Promise.all(promises).finally(() => {
    compiler2.finishBuild();
    fs.rmSync(compiler2.config.paths.temp, { recursive: true, force: true });
});
