
import {
    state, createLib, createBridgeFile, buildWasm, buildDependencies, getTargetParams, getFilteredBuildTargets, isSourceNewer,
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
                    await buildDependencies({ targetParams: { ...targetParams, buildType: [buildTargetDebug.buildType] } });
                    const force = isSourceNewer(buildTargetDebug);
                    const sourceBuilt = createLib(buildTargetDebug, 'Source', { force, buildSource: true });
                    // The Bridge cache is keyed on the nativeGlob fingerprint, so a
                    // request that raced ahead of the .h transforms rebuilds here
                    // once the bridge list has grown; a rebuilt lib must also force
                    // the final link or the wasm keeps the stale registrations.
                    const bridgeBuilt = createLib(buildTargetDebug, 'Bridge', { force, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/cpp-runtime/commonBridges.cpp`, ...bridges] });
                    await buildWasm(buildTargetDebug, { force: force || Boolean(sourceBuilt) || Boolean(bridgeBuilt) });
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
                        if (req.url === '/cpp.js') {
                            // The glue depends on the bridge set, which grows as .h
                            // imports are transformed; vite would otherwise serve the
                            // cached load() result forever. Invalidate so the load
                            // hook re-runs - cheap when nothing changed, and it heals
                            // a request that raced ahead of the transforms.
                            const mod = server.moduleGraph.getModuleById('/cpp.js');
                            if (mod) server.moduleGraph.invalidateModule(mod);
                        }
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
