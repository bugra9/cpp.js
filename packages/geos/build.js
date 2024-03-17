import fr from 'follow-redirects';
import os from 'os';
import fs from 'fs';
import path from 'path';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';

const cpuCount = os.cpus().length - 1;

const VERSION = '3.12.1';
const url = `https://download.osgeo.org/geos/geos-${VERSION}.tar.bz2`;

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
await decompress(`${compiler.config.paths.temp}/geos-${VERSION}.tar.bz2`, compiler.config.paths.temp);

const tempPath = `/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;
const workdir = `${tempPath}/geos-${VERSION}`;
const libdir = `${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/Emscripten-x86_64`;

fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });

compiler.run('emcmake', [
    'cmake', '.', `-DCMAKE_INSTALL_PREFIX=/live/${libdir}`, '-DCMAKE_BUILD_TYPE=Release',
    '-DBUILD_SHARED_LIBS=OFF', '-DBUILD_TESTING=OFF',
], { workdir, console: true });
compiler.run('emmake', ['make', `-j${cpuCount}`, 'install'], { workdir, console: true });

const distCmakeContent = fs.readFileSync(`${compiler.config.paths.cli}/assets/dist.cmake`, { encoding: 'utf8', flag: 'r' })
    .replace('___PROJECT_NAME___', compiler.config.general.name);
fs.writeFileSync(`${compiler.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);
fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
