import fr from 'follow-redirects';
import os from 'os';
import fs from 'fs';
import path from 'path';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import tiffConfig from 'cppjs-package-tiff/cppjs.config.js';
import sqlite3Config from 'cppjs-package-sqlite3/cppjs.config.js';
import { mkdir } from 'node:fs/promises';

const cpuCount = os.cpus().length - 1;

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
        await decompress(`${compiler2.config.paths.temp}/proj-${VERSION}.tar.gz`, compiler.config.paths.temp, { plugins: [decompressTargz()] });

        const tempPath = `/tmp/cppjs/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;
        const workdir = `${tempPath}/proj-${VERSION}`;
        const libdir = `/tmp/cppjs/live/${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/${platform}`;

        // fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });
        await mkdir(libdir, { recursive: true });

        let platformParams = [];
        let ext;
        switch (platform) {
            case 'Emscripten-x86_64':
                platformParams = ['-DBUILD_SHARED_LIBS=OFF'];
                ext = 'a';
                break;
            case 'Android-arm64-v8a':
                platformParams = [];
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

        const tiffPath = `/tmp/cppjs/live/${getPathInfo(tiffConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;
        const sqlite3Path = `/tmp/cppjs/live/${getPathInfo(sqlite3Config.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;

        compiler.run(null, [
            'cmake', '.', `-DCMAKE_INSTALL_PREFIX=${libdir}`, '-DCMAKE_BUILD_TYPE=Release', ...platformParams,
            '-DENABLE_CURL=OFF', '-DBUILD_TESTING=OFF', '-DBUILD_APPS=OFF',
            `-DSQLITE3_INCLUDE_DIR=${sqlite3Path}/include`, `-DSQLITE3_LIBRARY=${sqlite3Path}/lib/libsqlite3.${ext}`,
            `-DTIFF_INCLUDE_DIR=${tiffPath}/include`, `-DTIFF_LIBRARY_RELEASE=${tiffPath}/lib/libtiff.${ext}`,
        ], { workdir, console: true });
        compiler.run(null, ['cmake', '--build', '.', '--config', 'Release'], { workdir, console: true });
        compiler.run(null, ['cmake', '--install', '.'], { workdir, console: true });

        fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
    };
    promises.push(job());
});

Promise.all(promises).finally(() => {
    compiler2.finishBuild();
    fs.rmSync(compiler2.config.paths.temp, { recursive: true, force: true });
});
