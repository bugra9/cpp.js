import fs from 'fs';
import os from 'os';
import getCmakeParams from './getCmakeParams.js';
import getPathInfo from '../utils/getPathInfo.js';

const cpuCount = os.cpus().length - 1;

export default function createLib(compiler) {
    if (!compiler.platform) return;

    let platformParams = [];
    switch (compiler.platform) {
        case 'Emscripten-x86_64':
            platformParams = ['-DBUILD_TYPE=STATIC'];
            break;
        case 'Android-arm64-v8a':
            platformParams = ['-DBUILD_TYPE=SHARED'];
            break;
        case 'iOS-iphoneos':
            platformParams = ['-DBUILD_TYPE=STATIC'];
            break;
        case 'iOS-iphonesimulator':
            platformParams = ['-DBUILD_TYPE=STATIC'];
            break;
        default:
    }

    const libdir = `${getPathInfo(compiler.config.paths.output, compiler.config.paths.base).relative}/prebuilt/${compiler.platform}`;
    const basePlatform = compiler.platform.split('-', 1)[0];
    const params = getCmakeParams(compiler.config, '/tmp/cppjs/live/', true, false);
    compiler.run(null, [
        basePlatform === 'iOS' ? 'ios-cmake' : 'cmake', '/tmp/cppjs/cmake',
        '-DCMAKE_BUILD_TYPE=Release', ...platformParams,
        `-DCMAKE_INSTALL_PREFIX=/tmp/cppjs/live/${libdir}`, `-DPROJECT_NAME=${compiler.config.general.name}`,
        ...params,
    ]);
    if (basePlatform === 'iOS') {
        compiler.run(null, ['ios-cmake', '--build', '.', '--config', 'Release', '--target', 'install']);
    } else {
        compiler.run(null, ['make', `-j${cpuCount}`, 'install']);
    }

    fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
}
