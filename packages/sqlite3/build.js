import fr from 'follow-redirects';
import os from 'os';
import fs from 'fs';
import path from 'path';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import zlibConfig from 'cppjs-package-zlib/cppjs.config.js';
import { mkdir } from 'node:fs/promises';
import packageJson from './package.json' assert { type: 'json' };

const versionArray = packageJson.nativeVersion.split('.');
const VERSION = (versionArray[0] * 1000000 + versionArray[1] * 10000 + versionArray[2] * 100).toString();
const cpuCount = os.cpus().length - 1;

const url = `https://www.sqlite.org/2024/sqlite-autoconf-${VERSION}.tar.gz`;

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
    const basePlatform = platform.split('-', 1)[0];
    if (
        (basePlatform === 'iOS' && fs.existsSync(`${compiler2.config.paths.output}/prebuilt/${compiler2.config.general.name}.xcframework`))
        || (basePlatform !== 'iOS' && fs.existsSync(`${compiler2.config.paths.output}/prebuilt/${platform}/lib`))
    ) {
        return;
    }
    const job = async () => {
        const compiler = new CppjsCompiler(platform);
        await decompress(`${compiler2.config.paths.temp}/sqlite-autoconf-${VERSION}.tar.gz`, compiler.config.paths.temp, { plugins: [decompressTargz()] });

        const tempPath = `/tmp/cppjs/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;
        const workdir = `${tempPath}/sqlite-autoconf-${VERSION}`;
        const libdir = `/tmp/cppjs/live/${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/${platform}`;

        // fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });
        await mkdir(libdir, { recursive: true });

        let platformParams = [];
        switch (platform) {
            case 'Emscripten-x86_64':
                platformParams = ['--enable-shared=no', '--host=wasm32-unknown-emscripten'];
                break;
            case 'Android-arm64-v8a':
                platformParams = ['--host=aarch64-linux-android'];
                break;
            case 'iOS-iphoneos':
                platformParams = ['--host=arm-apple-darwin', '--enable-shared=no'];
                break;
            case 'iOS-iphonesimulator':
                platformParams = ['--host=x86_64-apple-darwin', '--enable-shared=no'];
                break;
            default:
        }

        const zlibPath = `/tmp/cppjs/live/${getPathInfo(zlibConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;
        compiler.run(null, ['./configure', `--prefix=${libdir}`, ...platformParams], {
            workdir,
            console: true,
            params: [
                '-e', `CFLAGS=-I${zlibPath}/include -DSQLITE_NOHAVE_SYSTEM -DSQLITE_DISABLE_LFS -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS -DSQLITE_ENABLE_JSON1 -DSQLITE_ENABLE_NORMALIZE -DSQLITE_ENABLE_COLUMN_METADATA`,
                '-e', `CPPFLAGS=-I${zlibPath}/include`,
                '-e', `LDFLAGS=-L${zlibPath}/lib`,
            ],
        });
        compiler.run(null, ['make', `-j${cpuCount}`, 'install'], { workdir, console: true });

        fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
    };
    promises.push(job());
});

Promise.all(promises).finally(() => {
    compiler2.finishBuild();
    fs.rmSync(compiler2.config.paths.temp, { recursive: true, force: true });
});
