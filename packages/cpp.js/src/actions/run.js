import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import pullDockerImage, { getDockerImage } from '../utils/pullDockerImage.js';
import getOsUserAndGroupId from '../utils/getOsUserAndGroupId.js';
import { getContentHash } from '../utils/hash.js';
import state from '../state/index.js';

const CROSSCOMPILER = 'aarch64-linux-android33';
const ANDROID_NDK = '/opt/android-sdk/ndk/25.2.9519653';
const t = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64/bin`;
const t2 = `${ANDROID_NDK}/toolchains/llvm/prebuilt/linux-x86_64`;

const iOSDevPath = '/Applications/Xcode.app/Contents/Developer';
const iosBinPath = `${iOSDevPath}/Toolchains/XcodeDefault.xctoolchain/usr/bin`;
const iosSdkPath = `${iOSDevPath}/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk`;
const iosSimSdkPath = `${iOSDevPath}/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk`;

const androidParams = [
    '-e', `AR=${t}/llvm-ar`,
    '-e', `AS=${t}/llvm-as`,
    '-e', `CC=${t}/${CROSSCOMPILER}-clang`,
    '-e', `CXX=${t}/${CROSSCOMPILER}-clang++`,
    '-e', `LD=${t}/ld`,
    '-e', `RANLIB=${t}/llvm-ranlib`,
    '-e', `STRIP=${t}/llvm-strip`,
    '-e', `NM=${t}/nm`,
    '-e', `CFLAGS=--sysroot=${t2}/sysroot`,
];

const IOS_HOST_FLAGS = `-arch arm64 -arch arm64e -isysroot ${iosSdkPath} -fembed-bitcode`;
const IOS_SIM_HOST_FLAGS = `-arch x86_64 -arch arm64 -arch arm64e -isysroot ${iosSimSdkPath} -fembed-bitcode`;
const IOS_IPHONE_PARAMS = [
    '-e', `CFLAGS="${IOS_HOST_FLAGS}"`,
    '-e', `CXXFLAGS="${IOS_HOST_FLAGS}"`,
    '-e', `LDFLAGS="${IOS_HOST_FLAGS}"`,
];
const IOS_SIM_PARAMS = [
    '-e', `CFLAGS="${IOS_SIM_HOST_FLAGS}"`,
    '-e', `CXXFLAGS="${IOS_SIM_HOST_FLAGS}"`,
    '-e', `LDFLAGS="${IOS_SIM_HOST_FLAGS}"`,
];
const iosParams = [
    '-e', `AR=${iosBinPath}/ar`,
    '-e', `AS=${iosBinPath}/as`,
    '-e', `CC=${iosBinPath}/clang`,
    '-e', `CXX=${iosBinPath}/clang++`,
    '-e', `CPP=${iosBinPath}/cpp`,
    '-e', `LD=${iosBinPath}/ld`,
    '-e', `RANLIB=${iosBinPath}/ranlib`,
    '-e', `STRIP=${iosBinPath}/strip`,
    '-e', `NM=${iosBinPath}/llvm-nm`,
];

/* const iosMetalParams = [
    '-e', `AR=${iosBinPath}/metal-ar`,
    '-e', `AS=${iosBinPath}/metal-as`,
    '-e', `CC=${iosBinPath}/clang`,
    '-e', `CXX=${iosBinPath}/clang++`,
    '-e', `CPP=${iosBinPath}/cpp`,
    '-e', `LD=${iosBinPath}/ld`,
    '-e', `RANLIB=${iosBinPath}/metal-ranlib`,
    '-e', `STRIP=${iosBinPath}/metal-strip`,
    '-e', `NM=${iosBinPath}/metal-nm`,
    '-e', `CFLAGS="${IOS_HOST_FLAGS}"`,
    '-e', `CXXFLAGS="${IOS_HOST_FLAGS}"`,
    '-e', `LDFLAGS="${IOS_HOST_FLAGS}"`,
]; */

export default function run(program, params = [], platformPrefix = null, platform = null, dockerOptions = {}) {
    const buildPath = platformPrefix ? `${state.config.paths.build}/${platformPrefix}/${platform}` : state.config.paths.build;
    if (!fs.existsSync(buildPath)) {
        fs.mkdirSync(buildPath, { recursive: true });
    }

    const [basePlatform, ...arch] = (platform || 'unknown-unknown').split('-'); // Emscripten-x86_64, Android-arm64-v8a, iOS-iphoneos, iOS-iphonesimulator
    if (basePlatform !== 'iOS' || program !== null) {
        pullDockerImage();
    }

    let dProgram = program;
    let dParams = params;
    let platformParams = [];
    if (program === null) {
        switch (basePlatform) {
            case 'Emscripten':
                platformParams = ['-e', 'CXXFLAGS=-fexceptions', '-e', 'CFLAGS=-fexceptions'];
                if (params[0].includes('configure')) dProgram = 'emconfigure';
                else if (params[0] === 'make') dProgram = 'emmake';
                else if (params[0] === 'cmake') dProgram = 'emcmake';
                else if (params[0] === 'cc') dProgram = 'emcc';
                break;
            case 'Android':
                [dProgram, ...dParams] = params;
                platformParams = androidParams;
                if (dProgram === 'cmake') {
                    dParams = [
                        ...dParams,
                        '-DCMAKE_SYSTEM_NAME=Android', '-DCMAKE_SYSTEM_VERSION=33', '-DCMAKE_ANDROID_ARCH_ABI=arm64-v8a',
                        `-DCMAKE_ANDROID_NDK=${ANDROID_NDK}`,
                    ];
                }
                break;
            case 'iOS':
                [dProgram, ...dParams] = params;
                platformParams = [...iosParams, ...(arch[0] === 'iphoneos' ? IOS_IPHONE_PARAMS : IOS_SIM_PARAMS)];
                if (dProgram === 'cmake') {
                    platformParams = [];
                    if (dParams[0] !== '--build' && dParams[0] !== '--install') {
                        dParams = [
                            ...dParams,
                            '-G', 'Xcode',
                            '-DBUILD_SHARED_LIBS=OFF',
                            '-DFRAMEWORK=TRUE',
                            '-DCMAKE_OSX_DEPLOYMENT_TARGET=13.0',
                            '-DCMAKE_SYSTEM_NAME=iOS',
                            `-DMACOSX_FRAMEWORK_IDENTIFIER=org.js.cpp.${state.config.general.name}`,
                            `-DCMAKE_XCODE_ATTRIBUTE_PRODUCT_BUNDLE_IDENTIFIER=org.js.cpp.${state.config.general.name}`,
                            `-DCMAKE_OSX_SYSROOT='${arch[0] === 'iphoneos' ? iosSdkPath : iosSimSdkPath}'`,
                            `-DCMAKE_OSX_ARCHITECTURES=${arch[0] === 'iphoneos' ? 'arm64;arm64e' : 'arm64;arm64e;x86_64'}`,
                            `-DCMAKE_C_FLAGS=${arch[0] === 'iphoneos' ? '-fembed-bitcode' : '-fembed-bitcode-marker'}`,
                            `-DCMAKE_CXX_FLAGS=${arch[0] === 'iphoneos' ? '-fembed-bitcode' : '-fembed-bitcode-marker'}`,
                            '-DCMAKE_XCODE_ATTRIBUTE_CODE_SIGN_IDENTITY=\'iPhone Developer\'',
                            `-DCMAKE_XCODE_ATTRIBUTE_DEVELOPMENT_TEAM=${state.config.system.XCODE_DEVELOPMENT_TEAM}`,
                        ];
                    }
                } else if (dProgram === 'ios-cmake') {
                    dProgram = 'cmake';
                    platformParams = [];
                    if (dParams[0] !== '--build' && dParams[0] !== '--install') {
                        dParams = [
                            ...dParams,
                            `-DCMAKE_TOOLCHAIN_FILE='${state.config.paths.cli}/assets/ios.toolchain.cmake'`,
                            `-DPLATFORM=${arch[0] === 'iphoneos' ? 'OS64' : 'SIMULATORARM64'}`,
                            `-DARCHS=${arch[0] === 'iphoneos' ? 'arm64;arm64e' : 'arm64;arm64e;x86_64'}`,
                            '-DENABLE_BITCODE=TRUE',
                            '-DBUILD_SHARED_LIBS=OFF',
                            '-DFRAMEWORK=TRUE',
                            '-DCMAKE_OSX_DEPLOYMENT_TARGET=13.0',
                            '-DCMAKE_SYSTEM_NAME=iOS',
                            `-DMACOSX_FRAMEWORK_IDENTIFIER=org.js.cpp.${state.config.general.name}`,
                            `-DCMAKE_XCODE_ATTRIBUTE_PRODUCT_BUNDLE_IDENTIFIER=org.js.cpp.${state.config.general.name}`,
                            `-DCMAKE_OSX_SYSROOT='${arch[0] === 'iphoneos' ? iosSdkPath : iosSimSdkPath}'`,
                            `-DCMAKE_OSX_ARCHITECTURES=${arch[0] === 'iphoneos' ? 'arm64;arm64e' : 'arm64;arm64e;x86_64'}`,
                            `-DCMAKE_C_FLAGS=${arch[0] === 'iphoneos' ? '-fembed-bitcode' : '-fembed-bitcode-marker'}`,
                            `-DCMAKE_CXX_FLAGS=${arch[0] === 'iphoneos' ? '-fembed-bitcode' : '-fembed-bitcode-marker'}`,
                            '-DCMAKE_XCODE_ATTRIBUTE_CODE_SIGN_IDENTITY=\'iPhone Developer\'',
                            `-DCMAKE_XCODE_ATTRIBUTE_DEVELOPMENT_TEAM=${state.config.system.XCODE_DEVELOPMENT_TEAM}`,
                        ];
                    }
                }
                break;
            default:
        }
    }

    const env = {};
    let runner = 'DOCKER';
    if ((basePlatform === 'iOS' && program === null) || state.config.system.RUNNER === 'LOCAL') {
        runner = 'LOCAL';
    }

    if (runner === 'LOCAL') {
        const allowedEnv = [
            '^PWD$', '^SHELL$', '^LC_CTYPE$', '^PATH$', '^HOME$', '^TMPDIR$', '^USER$',
            '^PODS_*', '^CONFIGURATION_BUILD_DIR$', '^UNLOCALIZED_RESOURCES_FOLDER_PATH$',
        ];
        Object.entries(process.env).forEach(([key, value]) => {
            if (allowedEnv.some((e) => key.match(e))) {
                env[key] = value;
            }
        });
    }

    const pParams = [...platformParams, ...(dockerOptions.params || [])];
    for (let i = 0; i < pParams.length; i += 2) {
        if (pParams[i] === '-e') {
            const [key, ...rest] = pParams[i + 1].split('=');
            const value = rest.join('=');
            if (['CFLAGS', 'CXXFLAGS', 'CPPFLAGS', 'LDFLAGS'].includes(key)) {
                let v = value;
                if (v.startsWith('\'') || v.startsWith('"')) {
                    v = v.substring(1, v.length - 1);
                }
                if (env[key]) env[key] += ` ${v}`;
                else env[key] = v;
            } else {
                env[key] = value;
            }
        }
    }

    let fileExecParams;
    if (runner === 'LOCAL') {
        env.PATH = `/opt/homebrew/bin:${env.PATH}`;

        const options = {
            cwd: dockerOptions.workdir || buildPath,
            stdio: dockerOptions.console ? 'inherit' : ['ignore', 'pipe', 'pipe'],
            env,
        };
        fileExecParams = [dProgram, dParams, options];
    } else if (runner === 'DOCKER') {
        const dockerEnv = [];
        Object.entries(env).forEach(([key, value]) => {
            dockerEnv.push('-e', `${key}=${value}`);
        });
        const options = { cwd: buildPath, stdio: dockerOptions.console ? 'inherit' : ['ignore', 'pipe', 'pipe'] };

        let runnerParams = [];
        let imageOrContainer = null;
        if (state.config.system.RUNNER === 'DOCKER_RUN') {
            imageOrContainer = getDockerImage();
            runnerParams = ['run', '--rm', '-v', `${state.config.paths.base}:/tmp/cppjs/live`];
        } else if (state.config.system.RUNNER === 'DOCKER_EXEC') {
            imageOrContainer = `${getDockerImage()}-${getContentHash(state.config.paths.base)}`.replace('/', '-').replace(':', '-');
            runnerParams = ['exec'];
        } else {
            throw new Error(`The runner ${state.config.system.RUNNER} is invalid.`);
        }

        const args = [
            ...runnerParams,
            '--user', getOsUserAndGroupId(),
            '--workdir', replaceBasePathForDocker(dockerOptions.workdir || buildPath),
            ...replaceBasePathForDocker(dockerEnv),
            // '-e', replaceBasePathForDocker(`CCACHE_DIR=${state.config.paths.build}/ccache`),
            imageOrContainer,
            replaceBasePathForDocker(dProgram),
            ...replaceBasePathForDocker(dParams),
        ];
        fileExecParams = ['docker', args, options];
    } else {
        throw new Error(`The runner ${state.config.system.RUNNER} or command is invalid.`);
    }

    try {
        execFileSync(...fileExecParams);
    } catch (e) {
        console.log(e?.stdout?.toString() || 'stdout is empty');
        console.error(e?.stderr?.toString() || 'stderr is empty');
        console.error('An error occurred while running the application. Please check the logs for more details.');
        process.exit();
    }
}

function replaceBasePathForDocker(data) {
    if (typeof data === 'string' || data instanceof String) {
        return data.replaceAll(state.config.paths.base, '/tmp/cppjs/live');
    }
    if (Array.isArray(data)) {
        return data.map((d) => replaceBasePathForDocker(d));
    }
    if (typeof value === 'object' && data !== null) {
        const newData = {};
        Object.entries(data).forEach(([key, value]) => {
            newData[key] = replaceBasePathForDocker(value);
        });
    }
    return data;
}
