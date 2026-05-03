import {
    state, createLib, getParentPath,
    createXCFramework, getAllBridges, getTargetParams, getFilteredBuildTargets
} from 'cpp.js';
import RNEmbind from '@cpp.js/core-embind-jsi/cppjs.config.mjs';
import RNCppjsPluginReactNative from '../cppjs.config.mjs';

const buildType = process.argv[2] || 'Release';

const targetParamsIPhoneOS = getTargetParams({ platform: ['ios'], arch: ['iphoneos'], runtime: ['mt'] }, true);
const targetParamsIPhoneSimulator = getTargetParams({ platform: ['ios'], arch: ['iphonesimulator'], runtime: ['mt'] }, true);
let buildTargetReleaseIPhoneOS = getFilteredBuildTargets(targetParamsIPhoneOS, { buildType: 'release' })?.[0];
let buildTargetDebugIPhoneOS = getFilteredBuildTargets(targetParamsIPhoneOS, { buildType: 'debug' })?.[0];
let buildTargetReleaseIPhoneSimulator = getFilteredBuildTargets(targetParamsIPhoneSimulator, { buildType: 'release' })?.[0];
let buildTargetDebugIPhoneSimulator = getFilteredBuildTargets(targetParamsIPhoneSimulator, { buildType: 'debug' })?.[0];

if ((!buildTargetReleaseIPhoneOS && !buildTargetDebugIPhoneOS) || (!buildTargetReleaseIPhoneSimulator && !buildTargetDebugIPhoneSimulator)) {
    throw new Error('No build targets found');
}

if (!buildTargetDebugIPhoneOS) {
    buildTargetDebugIPhoneOS = buildTargetReleaseIPhoneOS;
} else if (!buildTargetReleaseIPhoneOS) {
    buildTargetReleaseIPhoneOS = buildTargetDebugIPhoneOS;
}

if (!buildTargetDebugIPhoneSimulator) {
    buildTargetDebugIPhoneSimulator = buildTargetReleaseIPhoneSimulator;
} else if (!buildTargetReleaseIPhoneSimulator) {
    buildTargetReleaseIPhoneSimulator = buildTargetDebugIPhoneSimulator;
}

const buildTargetIPhoneOS = buildType === 'Release' ? buildTargetReleaseIPhoneOS : buildTargetDebugIPhoneOS;
const buildTargetIPhoneSimulator = buildType === 'Release' ? buildTargetReleaseIPhoneSimulator : buildTargetDebugIPhoneSimulator;

const projectPath = getParentPath(RNCppjsPluginReactNative.paths.config);
const RNEmbindProjectPath = getParentPath(RNEmbind.paths.config);

const bridges = getAllBridges();
const options = {
    name: 'react-native-cppjs',
    buildSource: true,
    nativeGlob: [
        `${state.config.paths.cli}/assets/cpp-runtime/commonBridges.cpp`,
        ...bridges,
        `${RNEmbindProjectPath}/cpp/src/emscripten/bind.cpp`,
        `${state.config.paths.project}/node_modules/react-native/ReactCommon/jsi/jsi/jsi.cpp`,
    ],
    headerGlob: [
        `${RNEmbindProjectPath}/cpp/src/**/*.h`,
    ],
    headerDirs: [
        `${RNEmbindProjectPath}/cpp/src`,
        `${state.config.paths.project}/node_modules/react-native/ReactCommon/jsi`,
    ],
};

createLib(buildTargetIPhoneOS, 'Full', options);
createLib(buildTargetIPhoneSimulator, 'Full', options);

const overrideConfig = {
    paths: {
        project: projectPath,
        output: `${state.config.paths.build}/Full-${buildType}`,
    },
    export: {
        libName: ['react-native-cppjs'],
    },
    targetParams: {
        platform: ['ios'],
        arch: ['iphoneos', 'iphonesimulator'],
        runtime: ['mt'],
        buildType: [buildTargetIPhoneOS.buildType],
    }
};
createXCFramework(overrideConfig);
