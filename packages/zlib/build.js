import https from 'https';
import os from 'os';
import fs from 'fs';
import path from 'path';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import { mkdir } from 'node:fs/promises';

const cpuCount = os.cpus().length - 1;

const VERSION = '1.3.1';
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

const tempPath = `/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;
const workdir = `${tempPath}/zlib-${VERSION}`;
const libdir = `${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/Emscripten-x86_64`;

fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });
await mkdir(libdir, { recursive: true });

compiler.run('emconfigure', ['./configure', `--prefix=/live/${libdir}`, '--static'], { workdir, console: true });
compiler.run('emmake', ['make', `-j${cpuCount}`, 'install'], { workdir: `${workdir}`, console: true });

const distCmakeContent = fs.readFileSync(`${compiler.config.paths.cli}/assets/dist.cmake`, { encoding: 'utf8', flag: 'r' })
    .replace('___PROJECT_NAME___', compiler.config.general.name);
fs.writeFileSync(`${compiler.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);
fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
