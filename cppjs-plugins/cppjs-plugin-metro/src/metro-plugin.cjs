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
                const target = cppjsState.targets.find((t) => t.platform === platform);
                const dependFilePath = getDependFilePathFunc(moduleName, target);
                if (dependFilePath) {
                    return context.resolveRequest(context, dependFilePath, platform);
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
