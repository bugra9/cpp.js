import { execFileSync } from 'child_process';
import pullDockerImage, { getDockerImage } from '../utils/pullDockerImage.js';
import getOsUserAndGroupId from '../utils/getOsUserAndGroupId.js';
import getBaseInfo from '../utils/getBaseInfo.js';
import getPathInfo from '../utils/getPathInfo.js';

const CROSSCOMPILER = 'aarch64-linux-android33';
const ANDROID_NDK = '/opt/android-sdk/ndk/25.2.9519653';
const t = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64/bin`;
const t2 = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64`;

const androidParams = [
    '-e', `AR=${t}/llvm-ar`,
    '-e', `AS=${t}/llvm-as`,
    '-e', `CC=${t}/${CROSSCOMPILER}-clang`,
    '-e', `CXX=${t}/${CROSSCOMPILER}-clang++`,
    '-e', `LD=${t}/ld`,
    '-e', `RANLIB=${t}/llvm-ranlib`,
    '-e', `STRIP=${t}/llvm-strip`,
    '-e', `NM=${t}/llvm-nm`,
    '-e', `CFLAGS=--sysroot=${t2}/sysroot`,
];

function getParentPath(path) {
    const pathArray = path.split('/');
    pathArray.pop();
    return pathArray.join('/');
}

export default function run(compiler, program, params = [], dockerOptions = {}) {
    pullDockerImage();

    const base = getBaseInfo(compiler.config.paths.base);
    const temp = getPathInfo(compiler.config.paths.temp, compiler.config.paths.base);

    const cMakeParentPath = getParentPath(compiler.config.paths.cmake);

    let dProgram = program;
    let dParams = params;
    let platformParams = [];
    switch (compiler.platform) {
        case 'Emscripten-x86_64':
            if (params[0].includes('configure')) dProgram = 'emconfigure';
            else if (params[0] === 'make') dProgram = 'emmake';
            else if (params[0] === 'cmake') dProgram = 'emcmake';
            else if (params[0] === 'cc') dProgram = 'emcc';
            break;
        case 'Android-arm64-v8a':
            [dProgram, ...dParams] = params;
            platformParams = androidParams;
            break;
        default:
    }

    const options = { cwd: temp.absolute, stdio: dockerOptions.console ? 'inherit' : 'pipe' };
    const args = [
        'run',
        '--user', getOsUserAndGroupId(),
        '-v', `${base.withoutSlash}:/live`,
        '-v', `${compiler.config.paths.cli}:/cli`,
        '-v', `${cMakeParentPath}:/cmake`,
        '--workdir', dockerOptions.workdir || `/live/${temp.relative}`,
        ...platformParams,
        ...(dockerOptions.params || []),
        getDockerImage(),
        dProgram, ...dParams,
    ];
    execFileSync('docker', args, options);
}
