import fs from 'node:fs';
import {
    state, getCmakeParameters, getParentPath,
    getAllBridges, getData,
} from 'cpp.js';
import RNEmbind from '@cpp.js/core-embind-jsi/cppjs.config.mjs';
import RNCppjsPluginReactNative from '../cppjs.config.mjs';

const projectPath = getParentPath(RNCppjsPluginReactNative.paths.config);
const RNEmbindProjectPath = getParentPath(RNEmbind.paths.config);

const androidAssetPath = `${state.config.paths.project}/android/app/src/main/assets/cppjs`;
if (!fs.existsSync(androidAssetPath)) {
    fs.mkdirSync(androidAssetPath, { recursive: true });
}
Object.entries(getData('data', 'Android-arm64-v8a')).forEach(([key, value]) => {
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
    isProd: true,
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
const params = getCmakeParameters('Android-arm64-v8a', options);

console.log(params.join(';;;'));
