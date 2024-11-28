let config;
let createBridgeFileFunc;
let dependPackageNames;
let headerRegex;
let moduleRegex;
import('cpp.js').then(({ state, createBridgeFile }) => {
    config = state.config;
    createBridgeFileFunc = createBridgeFile;
    dependPackageNames = config.allDependencies;
    headerRegex = new RegExp(`\\.(${config.ext.header.join('|')})$`);
    moduleRegex = new RegExp(`\\.(${config.ext.module.join('|')})$`);
});

module.exports = function CppjsMetroPlugin(defaultConfig) {
    return {
        resolver: {
            sourceExts: [...defaultConfig.resolver.sourceExts, ...['h', 'hpp', 'hxx', 'hh'], ...['i']],
            resolveRequest: (context, moduleName, platform) => {
                if (moduleName === 'cpp.js') return context.resolveRequest(context, '@cpp.js/plugin-metro/empty.js', platform);

                if (headerRegex.test(moduleName) || moduleRegex.test(moduleName)) {
                    const dependPackage = dependPackageNames.find((d) => moduleName.startsWith(d.package.name));
                    if (dependPackage) {
                        const fullPlatform = platform === 'ios' ? 'iOS-iphoneos' : 'Android-arm64-v8a';
                        const filePath = moduleName.substring(dependPackage.package.name.length + 1);

                        let path = `${dependPackage.paths.output}/prebuilt/${fullPlatform}/${filePath}`;
                        if (headerRegex.test(moduleName)) {
                            path = `${dependPackage.paths.output}/prebuilt/${fullPlatform}/include/${filePath}`;
                        } else if (moduleRegex.test(moduleName)) {
                            path = `${dependPackage.paths.output}/prebuilt/${fullPlatform}/swig/${filePath}`;
                        }

                        createBridgeFileFunc(path);
                        return { type: 'empty' };
                    }

                    const path = context.resolveRequest(context, moduleName, platform)?.filePath;
                    if (path && config.paths.native.some((n) => path.startsWith(n))) {
                        createBridgeFileFunc(path);
                        return { type: 'empty' };
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
