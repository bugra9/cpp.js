
import { state, createLib, createBridgeFile, buildWasm, getTargetParams, getFilteredBuildTargets } from 'cpp.js';
import rollupCppjsPlugin from '@cpp.js/plugin-rollup';

import fs from 'node:fs';

const targetParams = getTargetParams({ platform: ['wasm'], arch: ['wasm32'], runtime: ['st'], runtimeEnv: ['browser'] }, true);
let buildTargetRelease = getFilteredBuildTargets(targetParams, { buildType: 'release' })?.[0];
let buildTargetDebug = getFilteredBuildTargets(targetParams, { buildType: 'debug' })?.[0];

if (!buildTargetRelease && !buildTargetDebug) {
    throw new Error('No build targets found');
}

if (!buildTargetDebug) {
    buildTargetDebug = buildTargetRelease;
} else if (!buildTargetRelease) {
    buildTargetRelease = buildTargetDebug;
}

const viteCppjsPlugin = (options) => {
    let isServe = false;
    let wasmBuilt = false;
    const bridges = [];
    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const sourceRegex = new RegExp(`\\.(${state.config.ext.source.join('|')})$`);

    async function ensureWasmBuilt() {
        if (!wasmBuilt) {
            createLib(buildTargetDebug, 'Source', { buildSource: true });
            createLib(buildTargetDebug, 'Bridge', { buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/commonBridges.cpp`, ...bridges] });
            await buildWasm(buildTargetDebug);
            wasmBuilt = true;
        }
    }

    return [
        rollupCppjsPlugin(options, bridges),
        {
            name: 'vite-plugin-cppjs',
            async load(source) {
                if (isServe && source === '/cpp.js') {
                    await ensureWasmBuilt();
                    return fs.readFileSync(`${state.config.paths.build}/${buildTargetDebug.jsName}`, { encoding: 'utf8', flag: 'r' });
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
                    server.middlewares.use(async (req, res, next) => {
                        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

                        // /cpp.js stays on Vite's load() hook above (so SPA HMR keeps working).
                        // The middleware only handles assets that bypass Vite's import pipeline:
                        // wasm/data files (rewritten to /@fs), Nuxt's /_nuxt/* prefixes (SSR
                        // resolves these server-side), and Emscripten's pthread worker URLs.

                        if (req.url === '/cpp.wasm') {
                            req.url = `/@fs/${state.config.paths.build}/${buildTargetDebug.wasmName}`;
                        } else if (req.url === '/cpp.data.txt') {
                            req.url = `/@fs/${state.config.paths.build}/${buildTargetDebug.dataTxtName}`;
                        } else if (req.url === '/_nuxt/cpp.js') {
                            try {
                                await ensureWasmBuilt();
                                res.setHeader('Content-Type', 'application/javascript');
                                res.end(fs.readFileSync(`${state.config.paths.build}/${buildTargetDebug.jsName}`, 'utf8'));
                                return;
                            } catch (err) {
                                console.error('Error serving /_nuxt/cpp.js:', err);
                            }
                        } else if (req.url === '/_nuxt/cpp.wasm') {
                            try {
                                await ensureWasmBuilt();
                                const buf = fs.readFileSync(`${state.config.paths.build}/${buildTargetDebug.wasmName}`);
                                res.setHeader('Content-Type', 'application/wasm');
                                res.setHeader('Content-Length', buf.length.toString());
                                res.end(buf);
                                return;
                            } catch (err) {
                                console.error('Error serving /_nuxt/cpp.wasm:', err);
                            }
                        } else if (req.url === '/_nuxt/cpp.data.txt') {
                            const dataPath = `${state.config.paths.build}/${buildTargetDebug.dataTxtName}`;
                            if (fs.existsSync(dataPath)) {
                                res.setHeader('Content-Type', 'text/plain');
                                res.end(fs.readFileSync(dataPath));
                                return;
                            }
                        } else if (
                            req.url === '/cpp.browser.js' || req.url === '/_nuxt/cpp.browser.js'
                            || req.url === '/cpp.worker.js' || req.url === '/_nuxt/cpp.worker.js'
                        ) {
                            // Emscripten pthread mode loads the same browser JS inside its workers.
                            try {
                                await ensureWasmBuilt();
                                const workerJsPath = `${state.config.paths.build}/${buildTargetDebug.jsName}`;
                                if (fs.existsSync(workerJsPath)) {
                                    res.setHeader('Content-Type', 'application/javascript');
                                    res.end(fs.readFileSync(workerJsPath, 'utf8'));
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
            configurePreviewServer(server) {
                // `vite preview` (and the playwright e2e:prod webServer) is just
                // a static file server — without COOP/COEP, SharedArrayBuffer is
                // unavailable and the pthread worker the mt builds spawn never
                // initialises, leaving the page stuck on its initial state. The
                // dev middleware above already sets these headers; mirror that
                // for preview so prod builds load identically.
                server.middlewares.use((req, res, next) => {
                    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
                    next();
                });
            },
            async handleHotUpdate({ file, server }) {
                if (file.startsWith(state.config.paths.build)) {
                    return;
                }
                if (headerRegex.test(file)) {
                    const bridgeFile = createBridgeFile(file);
                    bridges.push(bridgeFile);
                    createLib(buildTargetDebug, 'Bridge', { buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/commonBridges.cpp`, ...bridges] });
                    await buildWasm(buildTargetDebug);
                    server.ws.send({ type: 'full-reload' });
                } else if (sourceRegex.test(file)) {
                    createLib(buildTargetDebug, 'Source', { buildSource: true, bypassCmake: true });
                    await buildWasm(buildTargetDebug);
                    server.ws.send({ type: 'full-reload' });
                }
            },
        },
    ];
};

export default viteCppjsPlugin;
