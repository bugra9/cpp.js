 
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
        import('crossbind').then(({ state, getCrossbindScript, getRustJsScript, createBridgeFile }) => {
            resolve({ state, getCrossbindScript, getRustJsScript, createBridgeFile });
        }).catch((e) => reject(e));
    });
    return compilerClassPromise;
};

module.exports.transform = async ({ src, filename, ...rest }) => {
    const { state, getCrossbindScript, getRustJsScript, createBridgeFile } = await getCompilerClass();
    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const moduleRegex = new RegExp(`\\.(${state.config.ext.module.join('|')})$`);
    if (headerRegex.test(filename) || moduleRegex.test(filename) || filename.endsWith('.rs')) {
        let target;
        if (rest.options.platform === 'ios') target = state.targets.find((t) => t.platform === 'ios');
        else if (rest.options.platform === 'android') target = state.targets.find((t) => t.platform === 'android');
        else target = state.targets.find((t) => t.platform === 'wasm');

        // Rust surfaces need no bridge file here: the native bridge is the package's generated
        // companion crate; this only emits the JS proxy module (same shape as the .h flow).
        if (filename.endsWith('.rs')) {
            return upstreamTransformer.transform({ src: getRustJsScript(target, filename), filename, ...rest });
        }

        const bridgeFile = createBridgeFile(filename, target);

        return upstreamTransformer.transform({ src: getCrossbindScript(target, bridgeFile), filename, ...rest });
    }

    return upstreamTransformer.transform({ src, filename, ...rest });
};
