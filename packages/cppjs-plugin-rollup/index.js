import CppjsCompiler from 'cpp.js';

import fs from 'fs';

const rollupCppjsPlugin = (options, _compiler) => {
    const compiler = _compiler || new CppjsCompiler(options);

    return {
        name: 'rollup-plugin-cppjs',
        resolveId ( source ) {
            if (source === '/cpp.js') {
                return { id: source, external: true };
            }
            return null;
        },
        async transform(code, path) {
            if (!/.h$/.test(path)) {
                return
            }

            compiler.findOrCreateInterfaceFile(path);

            return "export default function() { return new Promise((resolve, reject) => import('/cpp.js').then(n => n.default(resolve))); }";
        },
        generateBundle() {
            compiler.createBridge();
            compiler.createWasm({ cc: ['-O3'] });
            this.emitFile({
                type: "asset",
                source: fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.js`),
                fileName: "cpp.js"
            });
            this.emitFile({
                type: "asset",
                source: fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`),
                fileName: "cpp.wasm"
            });
            fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
        },
    }
};

export default rollupCppjsPlugin;
