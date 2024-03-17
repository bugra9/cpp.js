import fr from 'follow-redirects';
import os from 'os';
import fs from 'fs';
import path from 'path';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import geosConfig from 'cppjs-package-geos/cppjs.config.js';
import projConfig from 'cppjs-package-proj/cppjs.config.js';
import sqlite3Config from 'cppjs-package-sqlite3/cppjs.config.js';
import zlibConfig from 'cppjs-package-zlib/cppjs.config.js';

const cpuCount = os.cpus().length - 1;

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

const tempPath = `/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;
const workdir = `${tempPath}/libspatialite-${VERSION}`;
const libdir = `${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/Emscripten-x86_64`;

fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });

const geosPath = `/live/${getPathInfo(geosConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const projPath = `/live/${getPathInfo(projConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const sqlite3Path = `/live/${getPathInfo(sqlite3Config.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const zlibPath = `/live/${getPathInfo(zlibConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;

compiler.run('emconfigure', [
    './configure', `--prefix=/live/${libdir}`, '--enable-shared=no', '--host=x86_64-pc-linux-gnu',
    `SQLITE3_CFLAGS=-I${sqlite3Path}/include`, `SQLITE3_LIBS=-L${sqlite3Path}/lib`, `--with-geosconfig=${geosPath}/bin/geos-config`,
    '--enable-geosadvanced=yes', '--enable-geopackage=yes', '--enable-examples=no', '--enable-minizip=no',
    '--enable-libxml2=no', '--disable-rttopo', '--enable-freexl=no',
], {
    workdir,
    console: true,
    params: [
        '-e', `CFLAGS=-I${geosPath}/include -I${projPath}/include -I${sqlite3Path}/include -I${zlibPath}/include -ULOADABLE_EXTENSION`,
        '-e', `CPPFLAGS=-I${geosPath}/include -I${projPath}/include -I${sqlite3Path}/include -I${zlibPath}/include`,
        '-e', `LDFLAGS=-L${geosPath}/lib -L${projPath}/lib -L${sqlite3Path}/lib -L${zlibPath}/lib`,
    ],
});
compiler.run('emmake', ['make', `-j${cpuCount}`, 'install'], { workdir, console: true });

const distCmakeContent = fs.readFileSync(`${compiler.config.paths.cli}/assets/dist.cmake`, { encoding: 'utf8', flag: 'r' })
    .replace('___PROJECT_NAME___', compiler.config.general.name);
fs.writeFileSync(`${compiler.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);
fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
