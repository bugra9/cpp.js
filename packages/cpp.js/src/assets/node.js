/* eslint-disable import/no-unresolved */
/* eslint-disable import/first */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */

import Module from 'cpp.js/module';
import systemConfig from 'cpp.js/systemConfig';

let cppJsPromise;

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

function initCppJs(userConfig = {}) {
    if (cppJsPromise) return cppJsPromise;

    const config = mergeDeep(systemConfig, userConfig);
    Object.entries(config.env).forEach(([key, value]) => config.env[key] = value.replace('_CPPJS_DATA_PATH_', `${__dirname}/data`));

    cppJsPromise = new Promise((resolve, reject) => {
        const m = {
            print(text) {
                if (config.logHandler) {
                    config.logHandler(text, 'stdout');
                } else {
                    console.debug(`wasm stdout: ${text}`);
                }
            },
            printErr(text) {
                if (config.errorHandler) {
                    config.errorHandler(text, 'stderr');
                } else {
                    console.error(`wasm stderr: ${text}`);
                }
            },
            locateFile(fileName) {
                let path = fileName;
                if (config.paths && config.paths.wasm && fileName.endsWith('.wasm')) {
                    path = config.paths.wasm;
                } else if (config.paths && config.paths.data && (fileName.endsWith('.data.txt') || fileName.endsWith('.data'))) {
                    path = config.paths.data;
                }

                let prefix = '';
                if (config.path) {
                    prefix = config.path;
                    if (prefix.slice(-1) !== '/') prefix += '/';
                } else {
                    prefix = `${__dirname}/`;
                }

                let output = prefix + path;
                if (output.endsWith('.data')) output += '.txt';
                return output;
            },

            preRun: [
                ({ ENV }) => {
                    if (ENV && config && config.env) {
                        Object.entries(config.env).forEach(([key, value]) => {
                            // eslint-disable-next-line no-param-reassign
                            ENV[key] = value;
                        });
                    }
                },
            ],
            onRuntimeInitialized() {
                if (config.onRuntimeInitialized) config.onRuntimeInitialized(m);
            },
            getPreloadedPackage(packageName) {
                // eslint-disable-next-line global-require
                const a = require('fs').readFileSync(`./${packageName}`, { flag: 'r' }).buffer;
                return a;
            },
            getFileBytes(path) {
                if (!path) return new Uint8Array();
                return m.FS.readFile(path, { encoding: 'binary' });
            },
            getFileList(path = 'virtual') {
                const contents = path.split('/').reduce((accumulator, currentValue) => accumulator.contents[currentValue], m.FS.root).contents;
                const fileList = [];
                Object.keys(contents).forEach((name) => {
                    const obj = contents[name];
                    if (obj.usedBytes) fileList.push({ path: `/${path}/${name}`, size: obj.usedBytes });
                    else if (obj.contents) fileList.push(...m.getFileList(`${path}/${name}`));
                });
                return fileList;
            },

            toArray(vector) {
                const output = [];
                for (let i = 0; i < vector.size(); i += 1) {
                    output.push(vector.get(i));
                }
                return output;
            },
            toVector(VectorClass, array = []) {
                const vector = new VectorClass();
                array.forEach((item) => {
                    vector.push_back(item);
                });
                return vector;
            },
        };
        if (config.getWasmFunction) {
            m.instantiateWasm = function instantiateWasm(info, receive) {
                const instance = new WebAssembly.Instance(config.getWasmFunction(), info);
                receive(instance);
                return instance.exports;
            };
        }
        Module(m).then(resolve).catch(reject);
    });

    return cppJsPromise;
}

if (typeof globalThis === 'object') {
    globalThis.CppJs = {
        initCppJs,
    };
}

export default initCppJs;
