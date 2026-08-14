import fs from 'node:fs';
import path from 'node:path';
import getData from '../actions/getData.js';
import loadJson from '../utils/loadJson.js';
import state from '../state/index.js';
import { parseSurface, createRustBridgeCrate, createCrateImportBridge } from '../utils/rustBridgeGen.js';

export default function getCppJsScript(target, bridgePath = null) {
    const bridgeExportFile = `${bridgePath}.exports.json`;
    let symbols = null;
    if (bridgePath) {
        symbols = loadJson(bridgeExportFile);
    }
    // No bridge means the bare `cpp.js` specifier: the runtime module, which owns init().
    return buildScript(target, symbols, bridgePath === null);
}

// The Rust analog of a .h import: parse the crate surface and emit the same proxy module
// (per-symbol lets assigned inside this module's initCppJs). Vectors come from the owning
// cargo package's config; classes/enums come from the parsed source.
export function getRustJsScript(target, rsFile) {
    // Compare real paths: dependency paths go through node_modules symlinks (pnpm workspaces)
    // while bundlers hand the transformer the resolved real file.
    const realCrateDir = (d) => {
        try { return fs.realpathSync(path.resolve(d.paths.project, d.export.crate ?? 'crate')); } catch (e) { return null; }
    };
    const rsReal = fs.realpathSync(rsFile);

    // Marker under <cache>/rust-crates/: a direct crate import - the model comes from the
    // upstream crate's own source, and the bridge is synthesized against the cargo dependency.
    const crateName = path.basename(rsReal, '.rs');
    const cargoDeps = state.config.cargoDependencies ?? {};
    if (Object.hasOwn(cargoDeps, crateName)
        && path.dirname(rsReal) === fs.realpathSync(path.join(state.config.paths.cache, 'rust-crates'))) {
        const { model } = createCrateImportBridge({
            crateName,
            spec: cargoDeps[crateName],
            cacheDir: state.config.paths.cache,
            dtsMode: state.config.dts,
            log: () => {},
        });
        return buildScript(target, [
            ...model.classes.map((c) => c.name),
            ...model.enums.map((e) => e.name),
            ...model.freeFns.map((f) => f.jsName),
        ]);
    }

    const pkg = state.config.allDependencies.find((d) => d.export?.type === 'cargo'
        && realCrateDir(d) && rsReal.startsWith(`${realCrateDir(d)}${path.sep}`));
    const model = parseSurface(fs.readFileSync(rsFile, 'utf8'), () => {});
    const vectors = pkg ? (pkg.export?.bindings?.vectors ?? []) : (state.config.export?.bindings?.vectors ?? []);
    if (!pkg) {
        // App-local .rs: synthesize its bridge crate on import (the C++ createBridgeFile analog);
        // the native builds pick every crate under .cppjs/rust-bridges up and link it.
        createRustBridgeCrate({
            rsFile: rsReal,
            cacheDir: state.config.paths.cache,
            projectPath: state.config.paths.project,
            dtsMode: state.config.dts,
            vectors,
            cargoDependencies: state.config.cargoDependencies ?? {},
            log: () => {},
        });
    }
    const symbols = [
        ...model.classes.map((c) => c.name),
        ...model.enums.map((e) => e.name),
        ...(model.freeFns ?? []).map((f) => f.jsName),
        ...vectors.map((v) => v.name),
    ];
    return buildScript(target, symbols);
}

function buildScript(target, symbols, isRuntimeModule = false) {
    if (!target) {
        throw new Error('The target is not available!');
    }
    const env = JSON.stringify(getData('env', target));
    const getPlatformScript = target.platform === 'wasm' ? getWebScript : getReactNativeScript;

    let symbolExportDefineString = '';
    let symbolExportAssignString = '';
    if (symbols && Array.isArray(symbols)) {
        symbolExportDefineString = symbols.map((s) => `export let ${s} = null;`).join('\n');
        symbolExportAssignString = symbols.map((s) => `${s} = m.${s};`).join('\n');
    }

    return `
        ${getPlatformScript(env)}

        export let AllSymbols = {};
        ${symbolExportDefineString}

        // Each proxy module registers how to bind its own exports, so one init() - from 'cpp.js'
        // or from any single module - resolves every imported module. Binding only inside the
        // owning module's init is what leaves the others' exports null.
        function __cppjsBind(m) {
            AllSymbols = m;
            ${symbolExportAssignString}
        }

        if (!globalThis.__cppjsBinders) globalThis.__cppjsBinders = new Set();
        globalThis.__cppjsBinders.add(__cppjsBind);
        // Imported after the runtime booted: this registration missed the run, so bind now.
        if (globalThis.__cppjsModule) __cppjsBind(globalThis.__cppjsModule);

        function __cppjsInit(config = {}) {
            // Boot once per app: the wasm module (or the JSI lib) must only start once.
            if (!globalThis.__cppjsBootPromise) {
                globalThis.__cppjsBootPromise = __cppjsBoot(config);
            }
            return globalThis.__cppjsBootPromise.then((m) => {
                globalThis.__cppjsModule = m;
                globalThis.__cppjsBinders.forEach((bind) => bind(m));
                return m;
            });
        }

        // Dropping the boot promise here is what lets a later init() start a fresh runtime;
        // the bound exports stay pointed at the dead module until it does.
        __cppjsInit.terminate = function terminate() {
            globalThis.__cppjsBootPromise = null;
            globalThis.__cppjsModule = null;
            if (globalThis.CppJs && globalThis.CppJs.initCppJs.terminate) {
                globalThis.CppJs.initCppJs.terminate();
            }
        };

        export { __cppjsInit as initCppJs };
        ${isRuntimeModule ? 'export { __cppjsInit as init };' : ''}
    `;
}

function getReactNativeScript(env) {
    return `
        import { NativeModules } from 'react-native';
        import Module from '@cpp.js/core-embind-jsi';

        const { RNJsiLib } = NativeModules;

        function setEnv() {
            const env = JSON.parse('${env}');
            const CPPJS_DATA_PATH = Module.CppJS.getEnv('CPPJS_DATA_PATH');

            Object.entries(env).forEach(([key, value]) => {
                Module.CppJS.setEnv(key, value.replace('_CPPJS_DATA_PATH_', CPPJS_DATA_PATH), false);
            });
        }

        // Starting the JSI lib twice re-runs every embind registration and aborts with
        // "Cannot register public name ... twice", so __cppjsInit keeps this to one call.
        async function __cppjsBoot() {
            if (!RNJsiLib || !RNJsiLib.start) {
                throw new Error('Module failed to initialise.');
            }
            await RNJsiLib.start();
            setEnv();
            return Module;
        }
    `;
}

function getWebScript(env) {
    const params = `{
        ...config,
        env: {...${env}, ...config.env},
        paths: {
            wasm: 'cpp.wasm',
            data: 'cpp.data.txt',
            worker: 'cpp.js',
            js: 'cpp.js',
        }
    }`;

    return `
        function __cppjsBoot(config) {
            return import(/* webpackIgnore: true */ '/cpp.js')
                .then(n => window.CppJs.initCppJs(${params}));
        }
    `;
}
