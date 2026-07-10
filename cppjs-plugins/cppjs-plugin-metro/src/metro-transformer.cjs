 
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
        let target;
        if (rest.options.platform === 'ios') target = state.targets.find((t) => t.platform === 'ios');
        else if (rest.options.platform === 'android') target = state.targets.find((t) => t.platform === 'android');
        else target = state.targets.find((t) => t.platform === 'wasm');

        const bridgeFile = createBridgeFile(filename, target);

        return upstreamTransformer.transform({ src: getCppJsScript(target, bridgeFile), filename, ...rest });
    }

    return upstreamTransformer.transform({ src, filename, ...rest });
};
