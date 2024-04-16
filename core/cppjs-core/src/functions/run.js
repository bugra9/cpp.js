import fs from 'fs';
import { execFileSync } from 'child_process';
import pullDockerImage, { getDockerImage } from '../utils/pullDockerImage.js';
import getOsUserAndGroupId from '../utils/getOsUserAndGroupId.js';
import getBaseInfo from '../utils/getBaseInfo.js';
import getPathInfo from '../utils/getPathInfo.js';

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

function getParentPath(path) {
    const pathArray = path.split('/');
    pathArray.pop();
    return pathArray.join('/');
}

export default function run(compiler, program, params = [], dockerOptions = {}) {
    const [basePlatform, ...arch] = (compiler.platform || 'unknown-unknown').split('-'); // Emscripten-x86_64, Android-arm64-v8a, iOS-iphoneos, iOS-iphonesimulator
    if (basePlatform !== 'iOS' || program !== null) {
        pullDockerImage();
    }

    const base = getBaseInfo(compiler.config.paths.base);
    const temp = getPathInfo(compiler.config.paths.temp, compiler.config.paths.base);

    const cMakeParentPath = getParentPath(compiler.config.paths.cmake);
    let dProgram = program;
    let dParams = params;
    let platformParams = [];
    if (program === null) {
        switch (basePlatform) {
            case 'Emscripten':
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
                            `-DMACOSX_FRAMEWORK_IDENTIFIER=org.js.cpp.${compiler.config.general.name}`,
                            `-DCMAKE_XCODE_ATTRIBUTE_PRODUCT_BUNDLE_IDENTIFIER=org.js.cpp.${compiler.config.general.name}`,
                            `-DCMAKE_OSX_SYSROOT='${arch[0] === 'iphoneos' ? iosSdkPath : iosSimSdkPath}'`,
                            `-DCMAKE_OSX_ARCHITECTURES=${arch[0] === 'iphoneos' ? 'arm64;arm64e' : 'arm64;arm64e;x86_64'}`,
                            `-DCMAKE_C_FLAGS=${arch[0] === 'iphoneos' ? '-fembed-bitcode' : '-fembed-bitcode-marker'}`,
                            `-DCMAKE_CXX_FLAGS=${arch[0] === 'iphoneos' ? '-fembed-bitcode' : '-fembed-bitcode-marker'}`,
                            // '-DCMAKE_XCODE_ATTRIBUTE_CODE_SIGN_IDENTITY=\'iPhone Developer\'',
                            // '-DCMAKE_XCODE_ATTRIBUTE_DEVELOPMENT_TEAM=7ZZLDWBUVT',
                        ];
                    }
                } else if (dProgram === 'ios-cmake') {
                    dProgram = 'cmake';
                    platformParams = [];
                    if (dParams[0] !== '--build' && dParams[0] !== '--install') {
                        dParams = [
                            ...dParams,
                            `-DCMAKE_TOOLCHAIN_FILE='${compiler.config.paths.cli}/assets/ios.toolchain.cmake'`,
                            `-DPLATFORM=${arch[0] === 'iphoneos' ? 'OS64' : 'SIMULATORARM64'}`,
                            `-DARCHS=${arch[0] === 'iphoneos' ? 'arm64;arm64e' : 'arm64;arm64e;x86_64'}`,
                            '-DENABLE_BITCODE=TRUE',
                            '-DBUILD_SHARED_LIBS=OFF',
                            '-DFRAMEWORK=TRUE',
                            '-DCMAKE_OSX_DEPLOYMENT_TARGET=13.0',
                            '-DCMAKE_SYSTEM_NAME=iOS',
                            `-DMACOSX_FRAMEWORK_IDENTIFIER=org.js.cpp.${compiler.config.general.name}`,
                            `-DCMAKE_XCODE_ATTRIBUTE_PRODUCT_BUNDLE_IDENTIFIER=org.js.cpp.${compiler.config.general.name}`,
                            `-DCMAKE_OSX_SYSROOT='${arch[0] === 'iphoneos' ? iosSdkPath : iosSimSdkPath}'`,
                            `-DCMAKE_OSX_ARCHITECTURES=${arch[0] === 'iphoneos' ? 'arm64;arm64e' : 'arm64;arm64e;x86_64'}`,
                            `-DCMAKE_C_FLAGS=${arch[0] === 'iphoneos' ? '-fembed-bitcode' : '-fembed-bitcode-marker'}`,
                            `-DCMAKE_CXX_FLAGS=${arch[0] === 'iphoneos' ? '-fembed-bitcode' : '-fembed-bitcode-marker'}`,
                            // '-DCMAKE_XCODE_ATTRIBUTE_CODE_SIGN_IDENTITY=\'iPhone Developer\'',
                            // '-DCMAKE_XCODE_ATTRIBUTE_DEVELOPMENT_TEAM=7ZZLDWBUVT',
                        ];
                    }
                }
                break;
            default:
        }
    }
    if (basePlatform === 'iOS' && program === null) {
        const allowedEnv = [
            '^PWD$', '^SHELL$', '^LC_CTYPE$', '^PATH$', '^HOME$', '^TMPDIR$', '^USER$',
            '^PODS_*', '^CONFIGURATION_BUILD_DIR$', '^UNLOCALIZED_RESOURCES_FOLDER_PATH$',
        ];
        const env = {};
        Object.entries(process.env).forEach(([key, value]) => {
            if (allowedEnv.some((e) => key.match(e))) {
                env[key] = value;
            }
        });
        const pParams = [...platformParams, ...(dockerOptions.params || [])];
        for (let i = 0; i < pParams.length; i += 2) {
            if (pParams[i] === '-e') {
                const [key, ...rest] = pParams[i + 1].split('=');
                const value = rest.join('=');
                if (['CFLAGS', 'CXXFLAGS', 'LDFLAGS'].includes(key)) {
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

        env.PATH = `/opt/homebrew/bin:${env.PATH}`;

        const options = {
            cwd: dockerOptions.workdir || `/tmp/cppjs/live/${temp.relative}`,
            stdio: dockerOptions.console ? 'inherit' : 'pipe',
            env,
        };

        if (!fs.existsSync('/tmp/cppjs')) fs.mkdirSync('/tmp/cppjs');
        if (fs.existsSync('/tmp/cppjs/live')) fs.unlinkSync('/tmp/cppjs/live');
        fs.symlinkSync(base.withoutSlash, '/tmp/cppjs/live');
        if (!fs.existsSync('/tmp/cppjs/cli')) fs.symlinkSync(compiler.config.paths.cli, '/tmp/cppjs/cli');
        if (!fs.existsSync('/tmp/cppjs/cmake')) fs.symlinkSync(cMakeParentPath, '/tmp/cppjs/cmake');

        execFileSync(dProgram, dParams, options);
    } else {
        const options = { cwd: temp.absolute, stdio: dockerOptions.console ? 'inherit' : 'pipe' };
        const args = [
            'run',
            '--user', getOsUserAndGroupId(),
            '-v', `${base.withoutSlash}:/tmp/cppjs/live`,
            '-v', `${compiler.config.paths.cli}:/tmp/cppjs/cli`,
            '-v', `${cMakeParentPath}:/tmp/cppjs/cmake`,
            '--workdir', dockerOptions.workdir || `/tmp/cppjs/live/${temp.relative}`,
            ...platformParams,
            ...(dockerOptions.params || []),
            getDockerImage(),
            dProgram, ...dParams,
        ];
        execFileSync('docker', args, options);
    }
}
