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

const ICONV_VERSION = '1.17';
const url = `https://ftp.gnu.org/pub/gnu/libiconv/libiconv-${ICONV_VERSION}.tar.gz`;

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

const compiler2 = new CppjsCompiler();
await downloadFile(url, compiler2.config.paths.temp);
await mkdir(`${compiler2.config.paths.output}/prebuilt`, { recursive: true });
const distCmakeContent = fs.readFileSync(`${compiler2.config.paths.cli}/assets/dist.cmake`, { encoding: 'utf8', flag: 'r' })
    .replace('___PROJECT_NAME___', compiler2.config.general.name);
fs.writeFileSync(`${compiler2.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);

const promises = [];
compiler2.getAllPlatforms().forEach((platform) => {
    if (fs.existsSync(`${compiler2.config.paths.output}/prebuilt/${platform}/lib`)) return;
    const job = async () => {
        const compiler = new CppjsCompiler(platform);
        await decompress(`${compiler2.config.paths.temp}/libiconv-${ICONV_VERSION}.tar.gz`, compiler.config.paths.temp, { plugins: [decompressTargz()] });

        const tempPath = `/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;
        const workdir = `${tempPath}/libiconv-${ICONV_VERSION}`;
        const libdir = `${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/${platform}/lib`;
        const includedir = `${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/${platform}/include`;

        // fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });
        await mkdir(libdir, { recursive: true });
        await mkdir(includedir, { recursive: true });

        let platformParams = [];
        switch (platform) {
            case 'Emscripten-x86_64':
                platformParams = ['--enable-shared=no', '--host=wasm32-unknown-emscripten'];
                break;
            case 'Android-arm64-v8a':
                platformParams = ['--host=aarch64-linux-android'];
                break;
            default:
        }

        compiler.run(null, ['./configure', `--prefix=${tempPath}`, ...platformParams], { workdir, console: true });
        compiler.run(null, ['make', `-j${cpuCount}`, 'lib/localcharset.h'], { workdir, console: true });
        compiler.run(null, ['make', `-j${cpuCount}`, 'install', `prefix='${tempPath}'`, `exec_prefix='${tempPath}'`, `libdir='/live/${libdir}'`, `includedir='/live/${includedir}'`], { workdir, console: true });

        fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
    };
    promises.push(job());
});

Promise.all(promises).finally(() => {
    fs.rmSync(compiler2.config.paths.temp, { recursive: true, force: true });
});
