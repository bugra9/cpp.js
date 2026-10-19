
import {
    state, createLib, createBridgeFile, buildWasm, buildDependencies, getTargetParams, getFilteredBuildTargets, isSourceNewer, getRustJsScript,
    isAppSource, getFileHash, buildProjectApp, appLayout, appOutputName, appTargetParams, publishApp, buildForSimulator,
    openInSimulator, buildApk, openOnDevice,
} from 'crossbind';
import rollupCrossbindPlugin from '@crossbind/plugin-rollup';

import fs from 'node:fs';
import { spawn } from 'node:child_process';

const isApp = state.config.target.runtimeEnv === 'app';
// An app's targets are what runs it during development, which appDevPlugin finds as the session starts.
const targetParams = isApp ? null : getTargetParams({ platform: ['wasm'], arch: ['wasm32'], runtime: ['st'], runtimeEnv: ['browser'] }, true);
let buildTargetRelease = isApp ? null : getFilteredBuildTargets(targetParams, { buildType: 'release' })?.[0];
let buildTargetDebug = isApp ? null : getFilteredBuildTargets(targetParams, { buildType: 'debug' })?.[0];

if (!isApp && !buildTargetRelease && !buildTargetDebug) {
    throw new Error('No build targets found');
}

if (!buildTargetDebug) {
    buildTargetDebug = buildTargetRelease;
}

// During development an app opens on the dev server. Its host is built for this machine first, an iOS app's for the
// Simulator or an Android app's for the attached device, and built and reopened whenever the native code or the native
// imports of the page change; the page itself reloads as any Vite page does. Closing the window, or the app on the
// Simulator or device, ends the session.
function appDevPlugin() {
    let isServe = false;
    let server = null;
    let appUrl = null;
    let app = null;
    let closeApp = null;
    let mobileApp = null;
    let building = Promise.resolve(false);
    let devParams = null;
    let target = null;
    const isMobile = () => ['ios', 'android'].includes(target.platform);
    const nativeRegex = new RegExp(`\\.(${[...state.config.ext.header, ...state.config.ext.source, 'rs'].join('|')})$`);

    async function build() {
        await buildDependencies({ targetParams: { ...devParams, buildType: [target.buildType] } });
        const changed = await buildProjectApp(target);
        if (!isMobile() || (!changed && mobileApp)) return changed;
        // A mobile app links in Xcode or packages in Gradle, as a desktop host links in its build: before the app that
        // runs gives way. Its project holds no page, which the dev server serves.
        const project = publishApp(target, { to: `${state.config.paths.build}/${appOutputName(target)}.debug` });
        mobileApp = target.platform === 'ios' ? buildForSimulator(project, 'Debug') : buildApk(project);
        return true;
    }

    // The session ends with the app, as the app ended.
    function end(status) {
        server.close().then(() => process.exit(status));
    }

    function open() {
        if (!isMobile()) {
            const executable = `${state.config.paths.build}/${target.appName}/${appLayout(target).executable}`;
            return spawn(executable, [], { stdio: 'inherit', env: { ...process.env, CROSSBIND_APP_URL: appUrl } });
        }
        // The terminal's input stays Vite's: simctl and adb would forward it to the device.
        const options = { env: { CROSSBIND_APP_URL: appUrl }, stdio: ['ignore', 'inherit', 'inherit'] };
        const opened = target.platform === 'ios' ? openInSimulator(mobileApp, { ...options, show: true }) : openOnDevice(mobileApp, options);
        closeApp = opened.close;
        return opened.child;
    }

    function launch() {
        const child = open();
        app = child;
        child.once('error', (error) => {
            server.config.logger.error(`crossbind: the app did not start: ${error.message}`);
            if (app === child) end(1);
        });
        child.once('exit', (code) => {
            if (app === child) end(code ?? 1);
        });
    }

    function stop() {
        const running = app;
        app = null;
        closeApp?.();
        closeApp = null;
        running?.kill();
    }

    // One build at a time, so an edit during a build waits for it. The window keeps running until a new host is ready,
    // and a build that changed nothing leaves it alone, unless no app runs because the last one failed to open.
    // Resolves to whether the app opened anew.
    function refresh({ always = false } = {}) {
        const next = building.catch(() => {}).then(build);
        building = next;
        return next.then((changed) => {
            if (!changed && !always && app) return false;
            // A new host may bind other names, so its page transforms the header modules again.
            server.moduleGraph.invalidateAll();
            stop();
            launch();
            return true;
        });
    }

    return {
        name: 'vite-plugin-crossbind-app',
        // Gradle writes reports into the Android project it builds, in crossbind's own directory, and an HTML file there
        // would reload the page.
        config: () => ({ server: { watch: { ignored: [`${state.config.paths.cache}/**`, `${state.config.paths.build}/**`] } } }),
        configResolved(config) {
            isServe = config.command === 'serve';
        },
        async load(source) {
            if (!isServe || source !== '/crossbind.js') return null;
            await building;
            return fs.readFileSync(`${state.config.paths.build}/${target.appJsName}`, { encoding: 'utf8' });
        },
        configureServer(devServer) {
            // This machine, the Simulator, or the Android device attached now. iOS and Android keep targets without a
            // runtime environment for React Native, which the filter leaves out.
            devParams = appTargetParams({ dev: true });
            [target] = getFilteredBuildTargets(devParams, { buildType: 'debug', runtimeEnv: 'app' });
            server = devServer;
            devServer.httpServer?.once('listening', () => {
                appUrl = `http://localhost:${devServer.httpServer.address().port}${devServer.config.base}`;
                refresh({ always: true }).catch((error) => devServer.config.logger.error(error.message));
            });
            devServer.httpServer?.once('close', stop);
            process.once('exit', stop);
        },
        async handleHotUpdate({ file }) {
            if (file.startsWith(state.config.paths.build) || file.startsWith(state.config.paths.cache)) return undefined;
            const isNative = nativeRegex.test(file);
            if (!isNative && !isAppSource(state.config.paths.project, file)) return undefined;
            try {
                // An app opened anew loads its page anew.
                if (await refresh()) return [];
            } catch (error) {
                server.config.logger.error(error.message);
            }
            return isNative ? [] : undefined;
        },
    };
}

const viteCrossbindPlugin = (options) => {
    if (isApp) {
        return [rollupCrossbindPlugin(options), appDevPlugin()];
    }
    let isServe = false;
    let base = '/';
    // The middleware invalidates /crossbind.js on every request so a request that raced ahead
    // of the .h transforms heals itself. With parallel test workers that means N requests enter
    // load() at once, and without this each one would run its own full dependency + source +
    // bridge + wasm build over the same output paths - minutes of contention, and pages binding
    // to glue from different build generations (two module instances, so embind rejects a
    // vector built by the other one). Concurrent callers share the in-flight build; the next
    // request after it settles still starts a fresh one.
    let inFlightBuild = null;
    const bridges = [];

    async function buildGlue() {
        await buildDependencies({ targetParams: { ...targetParams, buildType: [buildTargetDebug.buildType] } });
        const force = isSourceNewer(buildTargetDebug);
        const sourceBuilt = createLib(buildTargetDebug, 'Source', { force, buildSource: true });
        // The Bridge cache is keyed on the nativeGlob fingerprint, so a
        // request that raced ahead of the .h transforms rebuilds here
        // once the bridge list has grown; a rebuilt lib must also force
        // the final link or the wasm keeps the stale registrations.
        const bridgeBuilt = createLib(buildTargetDebug, 'Bridge', { force, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/cpp-runtime/commonBridges.cpp`, ...bridges] });
        await buildWasm(buildTargetDebug, { force: force || Boolean(sourceBuilt) || Boolean(bridgeBuilt) });
    }

    // The names the app imports decide what a dependency's header binds: after a source edit each imported header binds
    // again, and a changed bridge reloads the page, whose request for /crossbind.js links the wasm anew.
    function rebindImports(server) {
        const bridgeDir = `${state.config.paths.build}/bridge`;
        const stamp = () => (fs.existsSync(bridgeDir) ? fs.readdirSync(bridgeDir)
            .filter((name) => name.endsWith('.i.cpp'))
            .map((name) => `${name}:${getFileHash(`${bridgeDir}/${name}`)}`)
            .join('\n') : '');
        const headers = [...new Set(bridges)].filter((bridge) => bridge && fs.existsSync(`${bridge}.source`))
            .map((bridge) => fs.readFileSync(`${bridge}.source`, 'utf8').trim())
            .filter((header) => fs.existsSync(header));
        const before = stamp();
        headers.forEach((header) => createBridgeFile(header));
        if (stamp() === before) return false;
        headers.flatMap((header) => [...(server.moduleGraph.getModulesByFile(header) ?? [])])
            .forEach((mod) => server.moduleGraph.invalidateModule(mod));
        server.ws.send({ type: 'full-reload' });
        return true;
    }

    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const sourceRegex = new RegExp(`\\.(${state.config.ext.source.join('|')})$`);

    return [
        rollupCrossbindPlugin(options, bridges),
        {
            name: 'vite-plugin-crossbind',
            async load(source) {
                if (isServe && source === '/crossbind.js') {
                    inFlightBuild = inFlightBuild || buildGlue().finally(() => { inFlightBuild = null; });
                    await inFlightBuild;
                    return fs.readFileSync(`${state.config.paths.build}/${buildTargetDebug.jsName}`, { encoding: 'utf8', flag: 'r' });
                }
                return null;
            },
            configResolved(config) {
                isServe = config.command === 'serve';
                base = config.base;
                if (isServe) {
                    config.server.fs.allow.push(state.config.paths.build);
                }
            },
            configureServer(server) {
                if (isServe) {
                    server.middlewares.use((req, res, next) => {
                        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                        // The app asks under its base, which vite strips only after this middleware.
                        const url = req.url.startsWith(base) ? `/${req.url.slice(base.length)}` : req.url;
                        if (url === '/crossbind.js') {
                            // The glue depends on the bridge set, which grows as .h
                            // imports are transformed; vite would otherwise serve the
                            // cached load() result forever. Invalidate so the load
                            // hook re-runs - cheap when nothing changed, and it heals
                            // a request that raced ahead of the transforms.
                            const mod = server.moduleGraph.getModuleById('/crossbind.js');
                            if (mod) server.moduleGraph.invalidateModule(mod);
                        }
                        if (url === '/crossbind.wasm') req.url = `${base}@fs/${state.config.paths.build}/${buildTargetDebug.wasmName}`;
                        else if (url === '/crossbind.data.txt') req.url = `${base}@fs/${state.config.paths.build}/${buildTargetDebug.dataTxtName}`;
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
                // The cache holds what crossbind writes itself, staged Conan headers among it.
                if (file.startsWith(state.config.paths.build) || file.startsWith(state.config.paths.cache)) {
                    return;
                }
                if (headerRegex.test(file)) {
                    const bridgeFile = createBridgeFile(file);
                    if (!bridges.includes(bridgeFile)) bridges.push(bridgeFile);
                    createLib(buildTargetDebug, 'Bridge', { force: true, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/cpp-runtime/commonBridges.cpp`, ...bridges] });
                    await buildWasm(buildTargetDebug, { force: true });
                    server.ws.send({ type: 'full-reload' });
                } else if (sourceRegex.test(file)) {
                    createLib(buildTargetDebug, 'Source', { force: true, buildSource: true, bypassCmake: true });
                    await buildWasm(buildTargetDebug, { force: true });
                    server.ws.send({ type: 'full-reload' });
                } else if (file.endsWith('.rs') && !file.startsWith(state.config.paths.cache)) {
                    // Re-parse the surface so the bridge crate and .d.ts follow a changed API;
                    // cargo itself sees the edit (the bridge embeds the file via #[path]) and
                    // buildWasm rebuilds the app super-crate before relinking. Generated crates
                    // under the cache never take this path.
                    getRustJsScript(buildTargetDebug, file);
                    await buildWasm(buildTargetDebug, { force: true });
                    server.ws.send({ type: 'full-reload' });
                } else if (isAppSource(state.config.paths.project, file) && rebindImports(server)) {
                    return [];
                }
                return undefined;
            },
        },
    ];
};

export default viteCrossbindPlugin;
