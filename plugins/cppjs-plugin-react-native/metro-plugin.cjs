const fs = require('fs');

let compiler;
let dependPackageNames;
let headerRegex;
let moduleRegex;
import('cpp.js').then(({ default: CppjsCompiler }) => {
    compiler = new CppjsCompiler();
    dependPackageNames = compiler.config.getAllDependencies();
    headerRegex = new RegExp(`\\.(${compiler.config.ext.header.join('|')})$`);
    moduleRegex = new RegExp(`\\.(${compiler.config.ext.module.join('|')})$`);

    const defaultPath = `${compiler.config.paths.project}/.cppjs/default`;
    if (fs.existsSync(defaultPath)) {
        fs.unlinkSync(defaultPath);
    }
    fs.symlinkSync(compiler.config.paths.temp.split('/.cppjs/')[1], defaultPath);
});

// let CppjsCompiler;
// import('cpp.js').then(({ default: m }) => { CppjsCompiler = m; });

module.exports = function CppjsMetroPlugin(defaultConfig) {
    return {
        resolver: {
            sourceExts: [...defaultConfig.resolver.sourceExts, ...['h', 'hpp', 'hxx', 'hh'], ...['i']],
            resolveRequest: (context, moduleName, platform) => {
                if (moduleName === 'cpp.js') return context.resolveRequest(context, 'cppjs-plugin-react-native/empty.js', platform);

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

                        compiler.findOrCreateInterfaceFile(path);
                        return { type: 'empty' };
                    }

                    const path = context.resolveRequest(context, moduleName, platform)?.filePath;
                    if (path && compiler.config.paths.native.some((n) => path.startsWith(n))) {
                        compiler.findOrCreateInterfaceFile(path);
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
