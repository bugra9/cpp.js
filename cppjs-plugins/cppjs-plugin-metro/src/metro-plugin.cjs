let getDependFilePathFunc;
let cppjsState;
import('cpp.js').then(({ getDependFilePath, state }) => {
    getDependFilePathFunc = getDependFilePath;
    cppjsState = state;
});

module.exports = function CppjsMetroPlugin(defaultConfig) {
    return {
        resetCache: true,
        resolver: {
            sourceExts: [...defaultConfig.resolver.sourceExts, ...['h', 'hpp', 'hxx', 'hh'], ...['i']],
            resolveRequest: (context, moduleName, platform) => {
                // The `cpp.js` import above resolves asynchronously; until it lands (and for
                // platforms with no matching target) fall back to Metro's default resolution
                // instead of dereferencing undefined state.
                if (cppjsState && getDependFilePathFunc) {
                    const target = cppjsState.targets.find((t) => t.platform === platform);
                    const dependFilePath = target && getDependFilePathFunc(moduleName, target);
                    if (dependFilePath) {
                        return context.resolveRequest(context, dependFilePath, platform);
                    }
                }

                return context.resolveRequest(context, moduleName, platform);
            },
        },
        transformer: {
            ...defaultConfig.transformer,
            babelTransformerPath: require.resolve('./metro-transformer.cjs'),
        },
    };
};
