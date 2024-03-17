import fr from 'follow-redirects';
import os from 'os';
import fs from 'fs';
import path from 'path';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import projConfig from 'cppjs-package-proj/cppjs.config.js';
import tiffConfig from 'cppjs-package-tiff/cppjs.config.js';
import zlibConfig from 'cppjs-package-zlib/cppjs.config.js';

const cpuCount = os.cpus().length - 1;

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

const tempPath = `/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;
const workdir = `${tempPath}/libgeotiff-${VERSION}`;
const libdir = `${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/Emscripten-x86_64`;

fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });

const projPath = `/live/${getPathInfo(projConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const tiffPath = `/live/${getPathInfo(tiffConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;
const zlibPath = `/live/${getPathInfo(zlibConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/Emscripten-x86_64`;

compiler.run('emconfigure', [
    './configure', `--prefix=/live/${libdir}`, '--enable-shared=no', '--host=x86_64-pc-linux-gnu',
    `--with-proj=${projPath}`, `--with-libtiff=${tiffPath}`, `--with-zlib=${zlibPath}`,
], {
    workdir,
    console: true,
    params: [
        '-e', `CFLAGS=-I${projPath}/include -I${tiffPath}/include -I${zlibPath}/include -s ERROR_ON_UNDEFINED_SYMBOLS=0`,
        '-e', `CPPFLAGS=-I${projPath}/include -I${tiffPath}/include -I${zlibPath}/include -s ERROR_ON_UNDEFINED_SYMBOLS=0`,
        '-e', `LDFLAGS=-L${projPath}/lib -L${tiffPath}/lib -L${zlibPath}/lib`,
    ],
});
compiler.run('emmake', ['make', `-j${cpuCount}`, 'install'], { workdir, console: true });

const distCmakeContent = fs.readFileSync(`${compiler.config.paths.cli}/assets/dist.cmake`, { encoding: 'utf8', flag: 'r' })
    .replace('___PROJECT_NAME___', compiler.config.general.name);
fs.writeFileSync(`${compiler.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);
fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
