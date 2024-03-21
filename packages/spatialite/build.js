import fr from 'follow-redirects';
import os from 'os';
import fs from 'fs';
import path from 'path';
import replace from 'replace';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import geosConfig from 'cppjs-package-geos/cppjs.config.js';
import projConfig from 'cppjs-package-proj/cppjs.config.js';
import sqlite3Config from 'cppjs-package-sqlite3/cppjs.config.js';
import zlibConfig from 'cppjs-package-zlib/cppjs.config.js';
import { mkdir } from 'node:fs/promises';

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
        await decompress(`${compiler2.config.paths.temp}/libspatialite-${VERSION}.tar.gz`, compiler.config.paths.temp, { plugins: [decompressTargz()] });

        const tempPath = `/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;
        const workdir = `${tempPath}/libspatialite-${VERSION}`;
        const libdir = `${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/${platform}`;
        const workdirReal = `${compiler.config.paths.temp}/libspatialite-${VERSION}`;

        // fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });
        await mkdir(libdir, { recursive: true });

        let platformParams = [];
        let libs = [];
        switch (platform) {
            case 'Emscripten-x86_64':
                platformParams = ['--enable-shared=no', '--host=x86_64-pc-linux-gnu'];
                libs = ['-lsqlite3'];
                break;
            case 'Android-arm64-v8a':
                platformParams = ['--host=aarch64-linux-android'];
                libs = ['-lstdc++', '-lsqlite3', '-lm', '-ltiff', '-lgeos'];
                replace({
                    regex: '-lpthread', replacement: '', paths: [`${workdirReal}/configure`, `${workdirReal}/configure.ac`, `${workdirReal}/src/Makefile.in`, `${workdirReal}/src/Makefile.am`], recursive: false, silent: true,
                });
                fs.cpSync(`${compiler.config.paths.project}/config.sub`, `${workdirReal}/config.sub`);
                break;
            default:
        }

        const geosPath = `/live/${getPathInfo(geosConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;
        const sqlite3Path = `/live/${getPathInfo(sqlite3Config.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;

        const allDeps = compiler.config.getAllDependencies();
        const cFlags = allDeps.map((d) => `-I/live/${getPathInfo(d.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}/include`).join(' ');
        const ldFlags = allDeps.map((d) => `-L/live/${getPathInfo(d.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}/lib`).join(' ');

        compiler.run(null, [
            './configure', `--prefix=/live/${libdir}`, ...platformParams,
            `SQLITE3_CFLAGS=-I${sqlite3Path}/include`, `SQLITE3_LIBS=-L${sqlite3Path}/lib`, `--with-geosconfig=${geosPath}/bin/geos-config`,
            '--enable-geosadvanced=yes', '--enable-geopackage=yes', '--enable-examples=no', '--enable-minizip=no',
            '--enable-libxml2=no', '--enable-freexl=no', '--disable-rttopo',
        ], {
            workdir,
            console: true,
            params: [
                '-e', `CFLAGS=${cFlags}`,
                '-e', `CPPFLAGS=${cFlags}`,
                '-e', `LDFLAGS=${ldFlags} ${libs.join(' ')}`,
            ],
        });
        compiler.run(null, ['make', `-j${cpuCount}`, 'install'], { workdir, console: true });

        fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
    };
    promises.push(job());
});

Promise.all(promises).finally(() => {
    fs.rmSync(compiler2.config.paths.temp, { recursive: true, force: true });
});
