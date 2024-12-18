import {
    state, createLib, getParentPath,
    createXCFramework, getAllBridges,
} from 'cpp.js';
import RNEmbind from '@cpp.js/core-embind-jsi/cppjs.config.mjs';
import RNCppjsPluginReactNative from '../cppjs.config.mjs';

const projectPath = getParentPath(RNCppjsPluginReactNative.paths.config);
const RNEmbindProjectPath = getParentPath(RNEmbind.paths.config);

const bridges = getAllBridges();
const options = {
    name: 'react-native-cppjs',
    isProd: true,
    buildSource: true,
    nativeGlob: [
        `${state.config.paths.cli}/assets/commonBridges.cpp`,
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

createLib('iOS-iphoneos', 'Full', options);
createLib('iOS-iphonesimulator', 'Full', options);

const overrideConfig = {
    paths: {
        project: projectPath,
        output: `${state.config.paths.build}/Full-Release`,
    },
    export: {
        libName: ['react-native-cppjs'],
    }
};
createXCFramework(overrideConfig);
