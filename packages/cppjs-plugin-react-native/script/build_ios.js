import fs from 'fs';
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

state.config.paths.output = `${state.config.paths.build}/Full-Release`;
state.config.export.libName = ['react-native-cppjs'];
createXCFramework(false);
fs.cpSync(
    `${state.config.paths.output}/prebuilt/react-native-cppjs.xcframework`,
    `${projectPath}/react-native-cppjs.xcframework`,
    { recursive: true },
);
