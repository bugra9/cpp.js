import CppjsCompiler from 'cpp.js';

import fs from 'fs';
import p from "path";

const rollupCppjsPlugin = (options, _compiler) => {
    const compiler = _compiler || new CppjsCompiler();
    const headerRegex = new RegExp(`.(${compiler.config.ext.header.join('|')})$`);

    return {
        name: 'rollup-plugin-cppjs',
        resolveId ( source ) {
            if (source === '/cpp.js') {
                return { id: source, external: true };
            }
            return null;
        },
        async transform(code, path) {
            if (!headerRegex.test(path)) {
                return;
            }

            compiler.findOrCreateInterfaceFile(path);

            return "export default function() { return new Promise((resolve, reject) => import('/cpp.js').then(n => n.default(resolve))); }";
        },
        buildStart() {
            const watch = (dirs) => {
                dirs.forEach(dir => {
                    const filesToWatch = fs.readdirSync(dir);

                    for (let file of filesToWatch) {
                        const fullPath = p.join(dir, file);
                        const stats = fs.statSync(fullPath);

                        if (stats.isFile()) {
                            this.addWatchFile(fullPath);
                        } else if (stats.isDirectory()) {
                            watch([fullPath]);
                        }
                    }
                });
            };

            watch(compiler.config.paths.native);
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
            const isWatching = process.argv.includes('-w') || process.argv.includes('--watch');
            if (!isWatching) {
                fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
            }
        },
    }
};

export default rollupCppjsPlugin;
