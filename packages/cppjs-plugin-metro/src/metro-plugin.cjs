let getDependFilePathFunc;
import('cpp.js').then(({ getDependFilePath }) => {
    getDependFilePathFunc = getDependFilePath;
});

module.exports = function CppjsMetroPlugin(defaultConfig) {
    return {
        resetCache: true,
        resolver: {
            sourceExts: [...defaultConfig.resolver.sourceExts, ...['h', 'hpp', 'hxx', 'hh'], ...['i']],
            resolveRequest: (context, moduleName, platform) => {
                const fullPlatform = platform === 'ios' ? 'iOS-iphoneos' : 'Android-arm64-v8a';
                const dependFilePath = getDependFilePathFunc(moduleName, fullPlatform);
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
