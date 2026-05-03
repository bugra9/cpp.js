
import {
    state, createLib, createBridgeFile, buildWasm, getTargetParams, getFilteredBuildTargets, isSourceNewer,
} from 'cpp.js';
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
    const bridges = [];
    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const sourceRegex = new RegExp(`\\.(${state.config.ext.source.join('|')})$`);

    return [
        rollupCppjsPlugin(options, bridges),
        {
            name: 'vite-plugin-cppjs',
            async load(source) {
                if (isServe && source === '/cpp.js') {
                    const force = isSourceNewer(buildTargetDebug);
                    createLib(buildTargetDebug, 'Source', { force, buildSource: true });
                    createLib(buildTargetDebug, 'Bridge', { force, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/cpp-runtime/commonBridges.cpp`, ...bridges] });
                    await buildWasm(buildTargetDebug, { force });
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
                    server.middlewares.use((req, res, next) => {
                        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                        if (req.url === '/cpp.wasm') req.url = `/@fs/${state.config.paths.build}/${buildTargetDebug.wasmName}`;
                        else if (req.url === '/cpp.data.txt') req.url = `/@fs/${state.config.paths.build}/${buildTargetDebug.dataTxtName}`;
                        // else if (req.url === '/cpp.worker.js') req.url = `/@fs/${state.config.paths.build}/${state.config.general.name}.js`;
                        next();
                    });
                }
            },
            configurePreviewServer(server) {
                server.middlewares.use((req, res, next) => {
                    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
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
                    createLib(buildTargetDebug, 'Bridge', { force: true, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/cpp-runtime/commonBridges.cpp`, ...bridges] });
                    await buildWasm(buildTargetDebug, { force: true });
                    server.ws.send({ type: 'full-reload' });
                } else if (sourceRegex.test(file)) {
                    createLib(buildTargetDebug, 'Source', { force: true, buildSource: true, bypassCmake: true });
                    await buildWasm(buildTargetDebug, { force: true });
                    server.ws.send({ type: 'full-reload' });
                }
            },
        },
    ];
};

export default viteCppjsPlugin;
