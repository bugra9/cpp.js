import getData from '../actions/getData.js';
import loadJson from '../utils/loadJson.js';
import state from '../state/index.js';

export default function getCppJsScript(platform, bridgePath = null) {
    if (!platform || !state.platforms.All.includes(platform)) {
        throw new Error('The platform is not available!');
    }
    const env = JSON.stringify(getData('env', platform));
    const getPlatformScript = state.platforms.WebAssembly.includes(platform) ? getWebScript : getReactNativeScript;

    const bridgeExportFile = `${bridgePath}.exports.json`;
    let symbols = null;
    if (bridgePath) {
        symbols = loadJson(bridgeExportFile);
    }

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
                Module.CppJS.setEnv(key, value.replace('_CPPJS_DATA_PATH_', CPPJS_DATA_PATH), true);
            });
        }

        export function initCppJs(config = {}) {
            return new Promise(async (resolve, reject) => {
                if (RNJsiLib && RNJsiLib.start) {
                    await RNJsiLib.start();
                    setEnv();
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
            data: 'cpp.data.txt'
        }
    }`;

    return `
        export function initCppJs(config = {}) {
            return new Promise((resolve, reject) => {
                import(/* webpackIgnore: true */ '/cpp.js').then(n => {
                    return window.CppJs.initCppJs(${params});
                }).then(m => {
                    ${modulePrefix}
                    resolve(m);
                });
            });
        }
    `;
}
