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
        import('cpp.js').then(({ state, getCppJsScript, createBridgeFile }) => {
            resolve({ state, getCppJsScript, createBridgeFile });
        }).catch((e) => reject(e));
    });
    return compilerClassPromise;
};

module.exports.transform = async ({ src, filename, ...rest }) => {
    const { state, getCppJsScript, createBridgeFile } = await getCompilerClass();
    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const moduleRegex = new RegExp(`\\.(${state.config.ext.module.join('|')})$`);

    if (headerRegex.test(filename) || moduleRegex.test(filename)) {
        const bridgeFile = createBridgeFile(filename);

        let platform = null;
        if (rest.options.platform === 'ios') platform = 'iOS-iphoneos';
        else if (rest.options.platform === 'android') platform = 'Android-arm64-v8a';
        else platform = 'Emscripten-x86_64';
        return upstreamTransformer.transform({ src: getCppJsScript(platform, bridgeFile), filename, ...rest });
    }

    return upstreamTransformer.transform({ src, filename, ...rest });
};
