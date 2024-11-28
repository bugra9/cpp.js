// eslint-disable-next-line object-curly-newline
import { state, createLib, createBridgeFile, buildWasm } from 'cpp.js';
import rollupCppjsPlugin from '@cpp.js/plugin-rollup';

import fs from 'fs';

const viteCppjsPlugin = (options) => {
    let isServe = false;
    const bridges = [];
    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const sourceRegex = new RegExp(`\\.(${state.config.ext.source.join('|')})$`);

    return [
        rollupCppjsPlugin(options, bridges),
        {
            name: 'vite-plugin-cppjs',
            async load(source) {
                if (isServe && source === '/cpp.js') {
                    createLib('Emscripten-x86_64', 'Source', { isProd: false, buildSource: true });
                    createLib('Emscripten-x86_64', 'Bridge', { isProd: false, buildSource: false, nativeGlob: bridges });
                    await buildWasm('browser', false);
                    return fs.readFileSync(`${state.config.paths.build}/${state.config.general.name}.browser.js`, { encoding: 'utf8', flag: 'r' });
                }
                return null;
            },
            configResolved(config) {
                isServe = config.command === 'serve';
                if (isServe) {
                    config.server.fs.allow.push(state.config.paths.build);
                }
            },
            configureServer(server) {
                if (isServe) {
                    server.middlewares.use((req, res, next) => {
                        if (req.url === '/cpp.wasm') req.url = `/@fs/${state.config.paths.build}/${state.config.general.name}.wasm`;
                        next();
                    });
                }
            },
            async handleHotUpdate({ file, server }) {
                if (file.startsWith(state.config.paths.build)) {
                    return;
                }
                if (headerRegex.test(file)) {
                    const bridgeFile = createBridgeFile(file);
                    bridges.push(bridgeFile);
                    createLib('Emscripten-x86_64', 'Bridge', { isProd: false, buildSource: false, nativeGlob: bridges });
                    await buildWasm('browser', true);
                    server.ws.send({ type: 'full-reload' });
                } else if (sourceRegex.test(file)) {
                    createLib('Emscripten-x86_64', 'Source', { isProd: false, buildSource: true, bypassCmake: true });
                    await buildWasm('browser', false);
                    server.ws.send({ type: 'full-reload' });
                }
            },
        },
    ];
};

export default viteCppjsPlugin;
