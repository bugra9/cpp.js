import loadJson from '../utils/loadJson.js';
import writeJson from '../utils/writeJson.js';
import loadConfig from './loadConfig.js';

const cacheDir = `${process.cwd()}/.cppjs`;

const state = {
    platforms: {
        All: ['Emscripten-x86_64', 'Android-arm64-v8a', 'iOS-iphoneos', 'iOS-iphonesimulator'],
        WebAssembly: ['Emscripten-x86_64'],
        Android: ['Android-arm64-v8a'],
        iOS: ['iOS-iphoneos', 'iOS-iphonesimulator'],
    },
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
    state.platforms.All.forEach((platform) => {
        const basePlatform = platform.split('-', 1)[0];
        state.config.allDependencyPaths[platform] = {};
        state.config.allDependencies.forEach((d) => {
            d.export.libName.forEach((name) => {
                state.config.allDependencyPaths[platform][name] = {
                    root: `${d.paths.output}/prebuilt/${platform}`,
                };
                const dep = state.config.allDependencyPaths[platform][name];
                if (basePlatform === 'iOS') {
                    let xcRoot;
                    if (platform === 'iOS-iphoneos') {
                        xcRoot = `${d.paths.project}/${name}.xcframework/ios-arm64_arm64e`;
                    } else if (platform === 'iOS-iphonesimulator') {
                        xcRoot = `${d.paths.project}/${name}.xcframework/ios-arm64_arm64e_x86_64-simulator`;
                    }
                    dep.header = `${xcRoot}/Headers`;
                    dep.libPath = xcRoot;
                    dep.lib = `${dep.libPath}/lib${name}.a`;
                    dep.bin = `${dep.root}/bin`;
                } else {
                    dep.header = `${dep.root}/include`;
                    dep.libPath = `${dep.root}/lib`;
                    dep.lib = `${dep.libPath}/lib${name}.${basePlatform === 'Android' ? 'so' : 'a'}`;
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
