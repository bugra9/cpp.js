import loadJson from '../utils/loadJson.js';
import writeJson from '../utils/writeJson.js';
import loadConfig from './loadConfig.js';

const cacheDir = `${process.cwd()}/.cppjs`;

const state = {
    targets: [
        {
            platform: 'wasm',
            arch: 'wasm32',
            runtime: 'st',
            buildType: 'release',
            runtimeEnv: 'browser',
        },
        {
            platform: 'wasm',
            arch: 'wasm32',
            runtime: 'st',
            buildType: 'release',
            runtimeEnv: 'edge',
        },
        {
            platform: 'wasm',
            arch: 'wasm32',
            runtime: 'st',
            buildType: 'release',
            runtimeEnv: 'node',
        },
        {
            platform: 'wasm',
            arch: 'wasm32',
            runtime: 'st',
            buildType: 'debug',
            runtimeEnv: 'browser',
        },
        {
            platform: 'wasm',
            arch: 'wasm32',
            runtime: 'st',
            buildType: 'debug',
            runtimeEnv: 'edge',
        },
        {
            platform: 'wasm',
            arch: 'wasm32',
            runtime: 'st',
            buildType: 'debug',
            runtimeEnv: 'node',
        },
        {
            platform: 'wasm',
            arch: 'wasm32',
            runtime: 'mt',
            buildType: 'release',
            runtimeEnv: 'browser',
        },
        {
            platform: 'wasm',
            arch: 'wasm32',
            runtime: 'mt',
            buildType: 'release',
            runtimeEnv: 'node',
        },
        {
            platform: 'wasm',
            arch: 'wasm32',
            runtime: 'mt',
            buildType: 'debug',
            runtimeEnv: 'browser',
        },
        {
            platform: 'wasm',
            arch: 'wasm32',
            runtime: 'mt',
            buildType: 'debug',
            runtimeEnv: 'node',
        },
        {
            platform: 'wasm',
            arch: 'wasm64',
            runtime: 'st',
            buildType: 'release',
            runtimeEnv: 'browser',
        },
        {
            platform: 'wasm',
            arch: 'wasm64',
            runtime: 'st',
            buildType: 'release',
            runtimeEnv: 'edge',
        },
        {
            platform: 'wasm',
            arch: 'wasm64',
            runtime: 'st',
            buildType: 'release',
            runtimeEnv: 'node',
        },
        {
            platform: 'wasm',
            arch: 'wasm64',
            runtime: 'st',
            buildType: 'debug',
            runtimeEnv: 'browser',
        },
        {
            platform: 'wasm',
            arch: 'wasm64',
            runtime: 'st',
            buildType: 'debug',
            runtimeEnv: 'edge',
        },
        {
            platform: 'wasm',
            arch: 'wasm64',
            runtime: 'st',
            buildType: 'debug',
            runtimeEnv: 'node',
        },
        {
            platform: 'wasm',
            arch: 'wasm64',
            runtime: 'mt',
            buildType: 'release',
            runtimeEnv: 'browser',
        },
        {
            platform: 'wasm',
            arch: 'wasm64',
            runtime: 'mt',
            buildType: 'release',
            runtimeEnv: 'node',
        },
        {
            platform: 'wasm',
            arch: 'wasm64',
            runtime: 'mt',
            buildType: 'debug',
            runtimeEnv: 'browser',
        },
        {
            platform: 'wasm',
            arch: 'wasm64',
            runtime: 'mt',
            buildType: 'debug',
            runtimeEnv: 'node',
        },
        {
            platform: 'android',
            arch: 'arm64-v8a',
            runtime: 'mt',
            buildType: 'release',
        },
        {
            platform: 'android',
            arch: 'arm64-v8a',
            runtime: 'mt',
            buildType: 'debug',
        },
        {
            platform: 'android',
            arch: 'x86_64',
            runtime: 'mt',
            buildType: 'release',
        },
        {
            platform: 'android',
            arch: 'x86_64',
            runtime: 'mt',
            buildType: 'debug',
        },
        {
            platform: 'ios',
            arch: 'iphoneos',
            runtime: 'mt',
            buildType: 'release',
        },
        {
            platform: 'ios',
            arch: 'iphoneos',
            runtime: 'mt',
            buildType: 'debug',
        },
        {
            platform: 'ios',
            arch: 'iphonesimulator',
            runtime: 'mt',
            buildType: 'release',
        },
        {
            platform: 'ios',
            arch: 'iphonesimulator',
            runtime: 'mt',
            buildType: 'debug',
        },
    ],
    config: null,
    cache: {
        hashes: {},
        interfaces: {},
        bridges: {},
    },
};

if (typeof module !== 'undefined' && module.exports) {
    initProcessState();
} else {
    await initProcessState();
}

await initProcessState();

async function initProcessState() {
    state.cache = loadCacheState();
    state.config = await loadConfig();

    state.targets.forEach((target) => {
        target.path = `${target.platform}-${target.arch}-${target.runtime}-${target.buildType}`;
        target.releasePath = `${target.platform}-${target.arch}-${target.runtime}-release`;
        if (target.runtimeEnv && target.platform === 'wasm') {
            target.rawJsName = `${state.config.general.name}-${target.path}.${target.runtimeEnv}.js`;
            target.jsName = `${state.config.general.name}-${target.path}.${target.runtimeEnv}.js`;
            target.wasmName = `${state.config.general.name}-${target.path}.${target.runtimeEnv}.wasm`;
            target.dataName = `${state.config.general.name}-${target.path}.${target.runtimeEnv}.data`;
            target.dataTxtName = `${state.config.general.name}-${target.path}.${target.runtimeEnv}.data.txt`;
        }
    });

    setAllDependecyPaths();
    if (state.config.build?.setState) {
        state.config.build.setState(state);
    }
}

function loadCacheState() {
    const stateFilePath = `${cacheDir}/cache.json`;
    return loadJson(stateFilePath) || state.cache;
}

function setAllDependecyPaths() {
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
                        xcRoot = `${d.paths.project}/${name}.xcframework/ios-arm64_arm64e`;
                    } else if (target.arch === 'iphonesimulator') {
                        xcRoot = `${d.paths.project}/${name}.xcframework/ios-arm64_x86_64-simulator`;
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
