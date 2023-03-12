import CppjsCompiler from 'cpp.js';
import rollupCppjsPlugin from 'rollup-plugin-cppjs';

import fs from 'fs';

const viteCppjsPlugin = (options, _compiler) => {
    let isServe = false;
    const compiler = _compiler || new CppjsCompiler(options);
    const headerRegex = new RegExp(`.(${compiler.config.ext.header.join('|')})$`);
    const sourceRegex = new RegExp(`.(${compiler.config.ext.source.join('|')})$`);

    return [
        rollupCppjsPlugin(options, compiler),
        {
            name: 'vite-plugin-cppjs',
            load(source) {
                if (isServe && source === '/cpp.js') {
                    compiler.createBridge();
                    compiler.createWasm();
                    return fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.js`, {encoding:'utf8', flag:'r'});
                }
            },
            configResolved(config) {
                isServe = config.command === 'serve';
                if (isServe) {
                    config.server.fs.allow.push(compiler.config.paths.temp);
                }
            },
            configureServer(server) {
                if (isServe) {
                    server.middlewares.use((req, res, next) => {
                        if (req.url === '/cpp.wasm') req.url = `/@fs${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`;
                        next();
                    });
                }
            },
            handleHotUpdate({file, server}) {
                if (headerRegex.test(file)) {
                    compiler.findOrCreateInterfaceFile(file);
                    compiler.createBridge();
                } else if (sourceRegex.test(file)) {
                    compiler.createWasm();
                    server.ws.send({ type: 'full-reload' })
                }
            }
        }
    ]
};

export default viteCppjsPlugin;
