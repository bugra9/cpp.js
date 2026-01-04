// eslint-disable-next-line object-curly-newline
import { state, createLib, createBridgeFile, buildWasm } from 'cpp.js';
import rollupCppjsPlugin from '@cpp.js/plugin-rollup';

import fs from 'node:fs';

let wasmBuilt = false;

const viteCppjsPlugin = (options) => {
    let isServe = false;
    const bridges = [];
    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const sourceRegex = new RegExp(`\\.(${state.config.ext.source.join('|')})$`);

    async function ensureWasmBuilt() {
        if (!wasmBuilt) {
            createLib('Emscripten-x86_64', 'Source', { isProd: false, buildSource: true });
            createLib('Emscripten-x86_64', 'Bridge', { isProd: false, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/commonBridges.cpp`, ...bridges] });
            await buildWasm('browser', false);
            wasmBuilt = true;
        }
    }

    return [
        rollupCppjsPlugin(options, bridges),
        {
            name: 'vite-plugin-cppjs',
            configResolved(config) {
                isServe = config.command === 'serve';
                if (isServe) {
                    config.server.fs.allow.push(state.config.paths.build);
                }
            },
            configureServer(server) {
                if (isServe) {
                    // Serve cpp.js as ES module - must be before Vite's middleware
                    server.middlewares.use(async (req, res, next) => {
                        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

                        // Handle cpp.js - serve as ES module with global assignment
                        if (req.url === '/cpp.js' || req.url === '/_nuxt/cpp.js') {
                            try {
                                await ensureWasmBuilt();
                                const jsPath = `${state.config.paths.build}/${state.config.general.name}.browser.js`;
                                const content = fs.readFileSync(jsPath, 'utf-8');
                                res.setHeader('Content-Type', 'application/javascript');
                                res.end(content);
                                return;
                            } catch (err) {
                                console.error('Error serving cpp.js:', err);
                            }
                        }
                        // Handle wasm file - serve directly
                        else if (req.url === '/cpp.wasm' || req.url === '/_nuxt/cpp.wasm') {
                            try {
                                await ensureWasmBuilt();
                                const wasmPath = `${state.config.paths.build}/${state.config.general.name}.wasm`;
                                const wasmBuffer = fs.readFileSync(wasmPath);
                                res.setHeader('Content-Type', 'application/wasm');
                                res.setHeader('Content-Length', wasmBuffer.length.toString());
                                res.end(wasmBuffer);
                                return;
                            } catch (err) {
                                console.error('Error serving cpp.wasm:', err);
                            }
                        }
                        // Handle data file - serve directly
                        else if (req.url === '/cpp.data.txt' || req.url === '/_nuxt/cpp.data.txt') {
                            try {
                                const dataPath = `${state.config.paths.build}/${state.config.general.name}.data.txt`;
                                if (fs.existsSync(dataPath)) {
                                    const dataContent = fs.readFileSync(dataPath);
                                    res.setHeader('Content-Type', 'text/plain');
                                    res.end(dataContent);
                                    return;
                                }
                            } catch (err) {
                                console.error('Error serving cpp.data.txt:', err);
                            }
                        }
                        // Handle pthread worker file - serve the browser JS for web workers
                        // Workers request /cpp.browser.js in pthread mode
                        else if (req.url === '/cpp.browser.js' || req.url === '/_nuxt/cpp.browser.js' || req.url === '/cpp.worker.js' || req.url === '/_nuxt/cpp.worker.js') {
                            try {
                                await ensureWasmBuilt();
                                // Emscripten pthread mode uses the .browser.js file for workers
                                const workerJsPath = `${state.config.paths.build}/${state.config.general.name}.browser.js`;
                                if (fs.existsSync(workerJsPath)) {
                                    const content = fs.readFileSync(workerJsPath, 'utf-8');
                                    res.setHeader('Content-Type', 'application/javascript');
                                    res.end(content);
                                    return;
                                }
                            } catch (err) {
                                console.error('Error serving cpp.browser.js:', err);
                            }
                        }
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
                    createLib('Emscripten-x86_64', 'Bridge', { isProd: false, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/commonBridges.cpp`, ...bridges] });
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
