/* eslint-disable import/no-unresolved */
/* eslint-disable global-require */
const upstreamTransformer = (() => {
    try {
        return require('@expo/metro-config/babel-transformer');
    } catch (error) {
        try {
            return require('@react-native/metro-babel-transformer');
        } catch (e) {
            return require('metro-react-native-babel-transformer');
        }
    }
})();

let compilerClassPromise;
const getCompilerClass = () => {
    if (compilerClassPromise) return compilerClassPromise;
    compilerClassPromise = new Promise((resolve, reject) => {
        import('cpp.js').then(({ getData }) => {
            resolve({ getData });
        }).catch((e) => reject(e));
    });
    return compilerClassPromise;
};

module.exports.transform = async ({ src, filename, ...rest }) => {
    if (filename.endsWith('@cpp.js/plugin-metro/empty.js')) {
        let platform = null;
        if (rest.options.platform === 'ios') platform = 'iOS-iphoneos';
        else if (rest.options.platform === 'android') platform = 'Android-arm64-v8a';
        const { getData } = await getCompilerClass();
        const env = getData('env', platform);

        return upstreamTransformer.transform({
            src:
`
import { NativeModules } from 'react-native';
import Module from '@cpp.js/core-embind-jsi';

const { RNJsiLib } = NativeModules;

function setEnv() {
    const env = JSON.parse('${JSON.stringify(env)}');
    const CPPJS_DATA_PATH = Module.CppJS.getEnv('CPPJS_DATA_PATH');

    Object.entries(env).forEach(([key, value]) => {
        Module.CppJS.setEnv(key, value.replace('_CPPJS_DATA_PATH_', CPPJS_DATA_PATH), true);
    });
}

export function initCppJs(config = {}) {
    return new Promise((resolve, reject) => {
        if (RNJsiLib && RNJsiLib.start) {
            RNJsiLib.start();
            setEnv();
            resolve(Module);
        } else {
            reject('Module failed to initialise.');
        }
    });
}

export const Native = Module;

`,
            filename,
            ...rest,
        });
    }
    return upstreamTransformer.transform({ src, filename, ...rest });
};
