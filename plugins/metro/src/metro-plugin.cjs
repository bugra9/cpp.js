const path = require('node:path');

let getDependFilePathFunc;
let crossbindState;
import('crossbind').then(({ getDependFilePath, state }) => {
    getDependFilePathFunc = getDependFilePath;
    crossbindState = state;
});

module.exports = function CrossbindMetroPlugin(defaultConfig) {
    // Generated proxy modules (e.g. a cargo package's lib.rs) originate in package workspaces
    // outside the app's node_modules chain, so their bare imports (react-native, @babel/runtime,
    // @crossbind/core-embind-jsi, ...) must fall back to the app's resolution. extraNodeModules is
    // consulted only when normal resolution fails, so everything else is untouched.
    const projectRoot = defaultConfig.projectRoot || process.cwd();
    const appNodeModules = new Proxy({}, {
        get: (_, name) => {
            try {
                return path.dirname(require.resolve(`${String(name)}/package.json`, { paths: [projectRoot] }));
            } catch (e) {
                return path.join(projectRoot, 'node_modules', String(name));
            }
        },
    });

    return {
        resetCache: true,
        resolver: {
            extraNodeModules: appNodeModules,
            sourceExts: [...defaultConfig.resolver.sourceExts, ...['h', 'hpp', 'hxx', 'hh'], ...['i'], ...['rs']],
            resolveRequest: (context, moduleName, platform) => {
                // The `crossbind` import above resolves asynchronously; until it lands (and for
                // platforms with no matching target) fall back to Metro's default resolution
                // instead of dereferencing undefined state.
                if (crossbindState && getDependFilePathFunc) {
                    const target = crossbindState.targets.find((t) => t.platform === platform);
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
