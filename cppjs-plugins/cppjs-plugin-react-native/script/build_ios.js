import {
    state, createLib, getParentPath, buildDependencies,
    createXCFramework, getAllBridges, getTargetParams, getFilteredBuildTargets
} from 'cpp.js';
import RNEmbind from '@cpp.js/core-embind-jsi/cppjs.config.mjs';
import RNCppjsPluginReactNative from '../cppjs.config.mjs';
import { isIosLibsFresh, saveIosLibsStamp } from './iosLibCache.js';

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

const iosTargetParams = {
    platform: ['ios'],
    arch: [buildTargetIPhoneOS.arch, buildTargetIPhoneSimulator.arch],
    runtime: [buildTargetIPhoneOS.runtime],
    buildType: [buildTargetIPhoneOS.buildType],
};

await buildDependencies({ targetParams: iosTargetParams });

const cacheKeyArgs = [buildType, projectPath, [projectPath, RNEmbindProjectPath]];
if (isIosLibsFresh(...cacheKeyArgs)) {
    console.log(`cppjs: iOS libs (${buildType}) up to date — skipping native build.`);
} else {
    // We only reach this branch when the stamp says the libs are stale (a bridge/embind
    // source changed) or missing, so force the recompile: createLib otherwise skips when the
    // output lib dir already exists, which would repackage the xcframework from stale objects.
    createLib(buildTargetIPhoneOS, 'Full', { ...options, force: true });
    createLib(buildTargetIPhoneSimulator, 'Full', { ...options, force: true });

    const overrideConfig = {
        paths: {
            project: projectPath,
            output: `${state.config.paths.build}/Full-${buildType}`,
        },
        export: {
            libName: ['react-native-cppjs'],
        },
        targetParams: iosTargetParams,
    };
    createXCFramework(overrideConfig);
    saveIosLibsStamp(...cacheKeyArgs);
}
