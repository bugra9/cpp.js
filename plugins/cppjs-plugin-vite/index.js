import CppjsCompiler from 'cpp.js';
import rollupCppjsPlugin from 'rollup-plugin-cppjs';

import fs from 'fs';

const viteCppjsPlugin = (options, _compiler) => {
    let isServe = false;
    const compiler = _compiler || new CppjsCompiler();
    const headerRegex = new RegExp(`\\.(${compiler.config.ext.header.join('|')})$`);
    const sourceRegex = new RegExp(`\\.(${compiler.config.ext.source.join('|')})$`);

    return [
        rollupCppjsPlugin(options, compiler),
        {
            name: 'vite-plugin-cppjs',
            async load(source) {
                if (isServe && source === '/cpp.js') {
                    compiler.createBridge();
                    await compiler.createWasm();
                    return fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.browser.js`, { encoding: 'utf8', flag: 'r' });
                }
                return null;
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
                        if (req.url === '/cpp.wasm') req.url = `/@fs/${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`;
                        next();
                    });
                }
            },
            async handleHotUpdate({ file, server }) {
                if (file.startsWith(compiler.config.paths.temp)) {
                    return;
                }
                if (headerRegex.test(file)) {
                    compiler.findOrCreateInterfaceFile(file);
                    compiler.createBridge();
                } else if (sourceRegex.test(file)) {
                    await compiler.createWasm();
                    server.ws.send({ type: 'full-reload' });
                }
            },
        },
    ];
};

export default viteCppjsPlugin;
