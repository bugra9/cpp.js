const path = require('node:path');

let getDependFilePathFunc;
let cppjsState;
import('cpp.js').then(({ getDependFilePath, state }) => {
    getDependFilePathFunc = getDependFilePath;
    cppjsState = state;
});

module.exports = function CppjsMetroPlugin(defaultConfig) {
    // Generated proxy modules (e.g. a cargo package's lib.rs) originate in package workspaces
    // outside the app's node_modules chain, so their bare imports (react-native, @babel/runtime,
    // @cpp.js/core-embind-jsi, ...) must fall back to the app's resolution. extraNodeModules is
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
