import fs from 'node:fs';
import {
    state, getCmakeParameters, getParentPath,
    getAllBridges, getData, getTargetParams, getFilteredBuildTargets
} from 'cpp.js';
import RNEmbind from '@cpp.js/core-embind-jsi/cppjs.config.mjs';
import RNCppjsPluginReactNative from '../cppjs.config.mjs';

const buildType = process.argv[3] || 'Release';

const targetParams = getTargetParams({ platform: ['android'], arch: [process.argv[2]], runtime: ['mt'] }, true);
let buildTargetRelease = getFilteredBuildTargets(targetParams, { buildType: 'release' })?.[0];
let buildTargetDebug = getFilteredBuildTargets(targetParams, { buildType: 'debug' })?.[0];

if (!buildTargetRelease && !buildTargetDebug) {
    throw new Error('No build targets found');
}

if (!buildTargetDebug) {
    buildTargetDebug = buildTargetRelease;
} else if (!buildTargetRelease) {
    buildTargetRelease = buildTargetDebug;
}

const buildTarget = buildType === 'Release' ? buildTargetRelease : buildTargetDebug;

const projectPath = getParentPath(RNCppjsPluginReactNative.paths.config);
const RNEmbindProjectPath = getParentPath(RNEmbind.paths.config);

const androidAssetPath = `${state.config.paths.project}/android/app/src/main/assets/cppjs`;
if (!fs.existsSync(androidAssetPath)) {
    fs.mkdirSync(androidAssetPath, { recursive: true });
}
Object.entries(getData('data', buildTarget)).forEach(([key, value]) => {
    if (fs.existsSync(key)) {
        const dAssetPath = `${androidAssetPath}/${value}`;
        if (!fs.existsSync(dAssetPath)) {
            fs.mkdirSync(dAssetPath, { recursive: true });
            fs.cpSync(key, dAssetPath, { recursive: true });
        }
    }
});

const bridges = getAllBridges();
const options = {
    name: 'react-native-cppjs',
    buildSource: true,
    nativeGlob: [
        `${state.config.paths.cli}/assets/commonBridges.cpp`,
        ...bridges,
        `${projectPath}/cpp/src/JSI_module.cpp`,
        `${RNEmbindProjectPath}/cpp/src/emscripten/bind.cpp`,
        `${state.config.paths.project}/node_modules/react-native/ReactCommon/jsi/jsi/jsi.cpp`,
    ],
    headerDirs: [
        `${projectPath}/cpp/src`,
        `${RNEmbindProjectPath}/cpp/src`,
        `${state.config.paths.project}/node_modules/react-native/ReactCommon/jsi`,
    ],
};
const params = getCmakeParameters(buildTarget, options);

console.log(params.join(';;;'));
