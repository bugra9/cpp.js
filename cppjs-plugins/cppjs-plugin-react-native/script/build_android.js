import fs from 'node:fs';
import {
    state, getCmakeParameters, getParentPath, getAllBridges,
} from 'cpp.js';
import RNEmbind from '@cpp.js/core-embind-jsi/cppjs.config.mjs';
import RNCppjsPluginReactNative from '../cppjs.config.mjs';
import resolveBuildTarget from './resolveBuildTarget.js';

const arch = process.argv[2];
const buildType = process.argv[3] || 'Release';
const outFile = process.argv[4];

if (!arch || !outFile) {
    throw new Error('Usage: node build_android.js <abi> <buildType> <paramsOutFile>');
}

const buildTarget = resolveBuildTarget(arch, buildType);

const projectPath = getParentPath(RNCppjsPluginReactNative.paths.config);
const RNEmbindProjectPath = getParentPath(RNEmbind.paths.config);

const bridges = getAllBridges();
const options = {
    name: 'react-native-cppjs',
    buildSource: true,
    nativeGlob: [
        `${state.config.paths.cli}/assets/cpp-runtime/commonBridges.cpp`,
        ...bridges,
        `${projectPath}/cpp/src/JSI_module.cpp`,
        `${RNEmbindProjectPath}/cpp/src/emscripten/bind.cpp`,
    ],
    headerDirs: [
        `${projectPath}/cpp/src`,
        `${RNEmbindProjectPath}/cpp/src`,
    ],
};
const params = getCmakeParameters(buildTarget, options);

// Written to a file (one parameter per line), not stdout: cpp.js logging shares
// stdout, so CMake parsing the process output would break on any log line.
fs.writeFileSync(outFile, params.join('\n'));
