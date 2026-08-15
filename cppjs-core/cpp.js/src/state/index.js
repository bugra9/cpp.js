import fs from 'node:fs';
import path from 'node:path';
import loadJson from '../utils/loadJson.js';
import writeJson from '../utils/writeJson.js';
import { TARGETS, targetPathOf } from '../utils/targets.js';
import loadConfig from './loadConfig.js';

const cacheDir = `${process.cwd()}/.cppjs`;

const state = {
    targets: TARGETS.map((target) => ({ ...target })),
    config: null,
    cache: {
        hashes: {},
        interfaces: {},
        bridges: {},
    },
};

await initProcessState();

async function initProcessState() {
    state.cache = loadCacheState();
    state.config = await loadConfig();
    // Recipes read the wasi-sdk location from the environment (lazily, in
    // getBuildParams); mirror the system-config value there so both sources
    // behave the same.
    if (state.config.system.WASI_SDK_PATH && !process.env.CPPJS_WASI_SDK_PATH) {
        process.env.CPPJS_WASI_SDK_PATH = state.config.system.WASI_SDK_PATH;
    }

    state.targets.forEach((target) => {
        target.path = targetPathOf(target);
        target.releasePath = targetPathOf({ ...target, buildType: 'release' });
        if (target.runtimeEnv && target.platform === 'wasm') {
            target.rawJsName = `${state.config.general.name}-${target.path}.${target.runtimeEnv}.js`;
            target.jsName = `${state.config.general.name}-${target.path}.${target.runtimeEnv}.js`;
            target.wasmName = `${state.config.general.name}-${target.path}.${target.runtimeEnv}.wasm`;
            target.dataName = `${state.config.general.name}-${target.path}.${target.runtimeEnv}.data`;
            target.dataTxtName = `${state.config.general.name}-${target.path}.${target.runtimeEnv}.data.txt`;
        }
        if (target.platform === 'wasi') {
            // A wasi build is a single command module - no JS glue, no preload.
            target.wasmName = `${state.config.general.name}-${target.path}.wasm`;
        }
    });

    setAllDependecyPaths();

    // Bare cargo-crate import markers must exist BEFORE any bundler starts: metro resolves
    // against its startup file map, so a marker first created mid-resolution is invisible
    // to that very build.
    const cargoDeps = state.config.cargoDependencies ?? {};
    for (const name of Object.keys(cargoDeps)) {
        const marker = `${state.config.paths.cache}/rust-crates/${name}.rs`;
        if (!fs.existsSync(marker)) {
            fs.mkdirSync(path.dirname(marker), { recursive: true });
            fs.writeFileSync(marker, `// cpp.js cargo crate import marker: ${name}\n`);
        }
    }

    if (state.config.build?.setState) {
        state.config.build.setState(state);
    }
}

function loadCacheState() {
    const stateFilePath = `${cacheDir}/cache.json`;
    return loadJson(stateFilePath) || state.cache;
}

export function setAllDependecyPaths() {
    state.config.allDependencyPaths = {};
    state.targets.forEach((target) => {
        state.config.allDependencyPaths[target.path] = { cmake: {} };
        state.config.allDependencies.forEach((d) => {
            state.config.allDependencyPaths[target.path].cmake[d.general.name] = `${d.paths.output}/prebuilt`;
            d.export.libName.forEach((name) => {
                state.config.allDependencyPaths[target.path][name] = {
                    root: `${d.paths.output}/prebuilt/${target.path}`,
                };
                const entryArray = d?.targetSpecs?.filter(t => (
                    (!t.platform || t.platform === target.platform)
                    && (!t.arch || t.arch === target.arch)
                    && (!t.runtime || t.runtime === target.runtime)
                    && (!t.buildType || t.buildType === target.buildType)
                )).map(t => t?.specs);
                const platformConfig = Object.assign({}, ...entryArray);
                const isDynamicLib = target.platform === 'android' && platformConfig.libType !== 'static';
                const dep = state.config.allDependencyPaths[target.path][name];
                if (target.platform === 'ios') {
                    let xcRoot;
                    if (target.arch === 'iphoneos') {
                        xcRoot = `${d.paths.project}/${name}.xcframework/ios-arm64`;
                    } else if (target.arch === 'iphonesimulator') {
                        xcRoot = `${d.paths.project}/${name}.xcframework/ios-arm64-simulator`;
                    }
                    dep.header = `${xcRoot}/Headers`;
                    dep.libPath = xcRoot;
                    dep.lib = `${dep.libPath}/lib${name}.a`;
                    dep.bin = `${dep.root}/bin`;
                } else {
                    dep.header = `${dep.root}/include`;
                    dep.libPath = `${dep.root}/lib`;
                    dep.lib = `${dep.libPath}/lib${name}.${isDynamicLib ? 'so' : 'a'}`;
                    dep.bin = `${dep.root}/bin`;
                }
            });
        });
    });
}

export function saveCache() {
    writeJson(`${cacheDir}/cache.json`, state.cache);
}

export default state;
