import fr from 'follow-redirects';
import fs from 'fs';
import path from 'path';
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

const tempPath = `/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;
const workdir = `${tempPath}/proj-${VERSION}`;
const libdir = `${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/Emscripten-x86_64`;

fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });

const tiffPath = `/live/${getPathInfo(tiffConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const sqlite3Path = `/live/${getPathInfo(sqlite3Config.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;

compiler.run('emcmake', [
    'cmake', '.', `-DCMAKE_INSTALL_PREFIX=/live/${libdir}`,
    '-DENABLE_CURL=OFF', '-DBUILD_TESTING=OFF', '-DBUILD_SHARED_LIBS=OFF', '-DBUILD_APPS=OFF',
    `-DSQLITE3_INCLUDE_DIR=${sqlite3Path}/include`, `-DSQLITE3_LIBRARY=${sqlite3Path}/lib/libsqlite3.a`,
    `-DTIFF_INCLUDE_DIR=${tiffPath}/include`, `-DTIFF_LIBRARY_RELEASE=${tiffPath}/lib/libtiff.a`,
], { workdir, console: true });
compiler.run('emmake', ['make', 'install'], { workdir, console: true });

const distCmakeContent = fs.readFileSync(`${compiler.config.paths.cli}/assets/dist.cmake`, { encoding: 'utf8', flag: 'r' })
    .replace('___PROJECT_NAME___', compiler.config.general.name);
fs.writeFileSync(`${compiler.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);
fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
