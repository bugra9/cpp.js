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
    return buildScript(target, symbols);
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

function buildScript(target, symbols) {
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

    const scriptContent = `
        AllSymbols = m;
        ${symbolExportAssignString}
    `;

    return `
        export let AllSymbols = {};
        ${symbolExportDefineString}
        ${getPlatformScript(env, scriptContent)}
    `;
}

function getReactNativeScript(env, modulePrefix) {
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

        export function initCppJs(config = {}) {
            return new Promise(async (resolve, reject) => {
                if (RNJsiLib && RNJsiLib.start) {
                    // Boot once per app: every imported proxy module calls initCppJs to bind its
                    // own exports, but starting the JSI lib twice would re-run every embind
                    // registration and abort with "Cannot register public name ... twice".
                    if (!globalThis.__cppjsBootPromise) {
                        globalThis.__cppjsBootPromise = (async () => {
                            await RNJsiLib.start();
                            setEnv();
                        })();
                    }
                    await globalThis.__cppjsBootPromise;
                    const m = Module;
                    ${modulePrefix}
                    resolve(Module);
                } else {
                    reject('Module failed to initialise.');
                }
            });
        }
    `;
}

function getWebScript(env, modulePrefix) {
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
        export function initCppJs(config = {}) {
            return new Promise((resolve, reject) => {
                // Boot once per app: every imported proxy module calls initCppJs to bind its own
                // exports; the wasm module itself must only be instantiated once.
                if (!globalThis.__cppjsBootPromise) {
                    globalThis.__cppjsBootPromise = import(/* webpackIgnore: true */ '/cpp.js')
                        .then(n => window.CppJs.initCppJs(${params}));
                }
                globalThis.__cppjsBootPromise.then(m => {
                    ${modulePrefix}
                    resolve(m);
                });
            });
        }
    `;
}
