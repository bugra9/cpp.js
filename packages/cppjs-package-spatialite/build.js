import fr from 'follow-redirects';
import os from 'os';
import fs from 'fs';
import path from 'path';
import replace from 'replace';
import decompress from 'decompress';
import decompressTargz from 'decompress-targz';
import CppjsCompiler from 'cpp.js';
import getPathInfo from 'cpp.js/src/utils/getPathInfo.js';
import geosConfig from '@cpp.js/package-geos/cppjs.config.js';
import projConfig from '@cpp.js/package-proj/cppjs.config.js';
import sqlite3Config from '@cpp.js/package-sqlite3/cppjs.config.js';
import zlibConfig from '@cpp.js/package-zlib/cppjs.config.js';
import { mkdir } from 'node:fs/promises';
import packageJson from './package.json' assert { type: 'json' };

const VERSION = packageJson.nativeVersion;
const cpuCount = os.cpus().length - 1;

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
    const basePlatform = platform.split('-', 1)[0];
    if (
        (basePlatform === 'iOS' && fs.existsSync(`${compiler2.config.paths.output}/prebuilt/${compiler2.config.general.name}.xcframework`))
        || (basePlatform !== 'iOS' && fs.existsSync(`${compiler2.config.paths.output}/prebuilt/${platform}/lib`))
    ) {
        return;
    }
    const job = async () => {
        const compiler = new CppjsCompiler(platform);
        await decompress(`${compiler2.config.paths.temp}/libspatialite-${VERSION}.tar.gz`, compiler.config.paths.temp, { plugins: [decompressTargz()] });

        const tempPath = `/tmp/cppjs/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;
        const workdir = `${tempPath}/libspatialite-${VERSION}`;
        const libdir = `${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/${platform}`;
        const workdirReal = `${compiler.config.paths.temp}/libspatialite-${VERSION}`;

        // fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });
        // await mkdir(libdir, { recursive: true });

        let platformParams = [];
        let getDepLibPath;
        let getDepHeaderPath;
        let libs = [];
        switch (platform) {
            case 'Emscripten-x86_64':
                platformParams = ['--enable-shared=no', '--host=x86_64-pc-linux-gnu'];
                libs = ['-lsqlite3'];
                getDepLibPath = (dep, libName) => `/tmp/cppjs/live/${getPathInfo(dep.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}/lib`;
                getDepHeaderPath = (dep, libName) => `/tmp/cppjs/live/${getPathInfo(dep.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}/include`;
                break;
            case 'Android-arm64-v8a':
                platformParams = ['--host=aarch64-linux-android'];
                libs = ['-lstdc++', '-lsqlite3', '-lm', '-ltiff', '-lgeos'];
                getDepLibPath = (dep, libName) => `/tmp/cppjs/live/${getPathInfo(dep.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}/lib`;
                getDepHeaderPath = (dep, libName) => `/tmp/cppjs/live/${getPathInfo(dep.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}/include`;
                replace({
                    regex: '-lpthread', replacement: '', paths: [`${workdirReal}/configure`, `${workdirReal}/configure.ac`, `${workdirReal}/src/Makefile.in`, `${workdirReal}/src/Makefile.am`], recursive: false, silent: true,
                });
                fs.cpSync(`${compiler.config.paths.project}/config.sub`, `${workdirReal}/config.sub`);
                break;
            case 'iOS-iphoneos':
                platformParams = ['--host=arm-apple-darwin'];
                libs = ['-lstdc++', '-lsqlite3', '-lm', '-ltiff', '-lgeos'];
                getDepLibPath = (dep, libName) => `/tmp/cppjs/live/${getPathInfo(dep.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${libName}.xcframework/ios-arm64_arm64e`;
                getDepHeaderPath = (dep, libName) => `/tmp/cppjs/live/${getPathInfo(dep.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${libName}.xcframework/ios-arm64_arm64e/Headers`;
                break;
            case 'iOS-iphonesimulator':
                platformParams = ['--host=x86_64-apple-darwin'];
                libs = ['-lstdc++', '-lsqlite3', '-lm', '-ltiff', '-lgeos'];
                getDepLibPath = (dep, libName) => `/tmp/cppjs/live/${getPathInfo(dep.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${libName}.xcframework/ios-arm64_arm64e_x86_64-simulator`;
                getDepHeaderPath = (dep, libName) => `/tmp/cppjs/live/${getPathInfo(dep.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${libName}.xcframework/ios-arm64_arm64e_x86_64-simulator/Headers`;
                break;
            default:
        }

        const geosPath = `/tmp/cppjs/live/${getPathInfo(geosConfig.paths.project, compiler.config.paths.base).relative}/dist/prebuilt/${platform}`;

        const allDeps = compiler.config.getAllDependencies();
        const cFlags = allDeps.map((d) => `-I${getDepHeaderPath(d, d.general.name)}`).join(' ');
        const ldFlags = allDeps.map((d) => `-L${getDepLibPath(d, d.general.name)}`).join(' ');

        compiler.run(null, [
            './configure', `--prefix=/tmp/cppjs/live/${libdir}`, ...platformParams,
            `SQLITE3_CFLAGS=-I${getDepHeaderPath(sqlite3Config, 'sqlite3')}`, `SQLITE3_LIBS=-L${getDepLibPath(sqlite3Config, 'sqlite3')}`, `--with-geosconfig=${geosPath}/bin/geos-config`,
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
    compiler2.finishBuild();
    fs.rmSync(compiler2.config.paths.temp, { recursive: true, force: true });
});
