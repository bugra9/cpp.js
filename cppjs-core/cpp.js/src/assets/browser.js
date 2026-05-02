/* eslint-disable import/no-unresolved */
/* eslint-disable import/first */

import * as Comlink from 'comlink';
import Module from 'cpp.js/module';
import systemConfig from 'cpp.js/systemConfig';

const STATIC_PATHS = {
    opfs: '/opfs',
    memfs: '/memfs'
};
const isWorkerScope = typeof WorkerGlobalScope !== 'undefined'
    && typeof self !== 'undefined'
    && self instanceof WorkerGlobalScope;
const isBrowserSupportOPFS = navigator.storage && navigator.storage.getDirectory;

// === Embind <-> Comlink Bridge ===
// Worker-side registry: id → original embind object
// Main-thread registry: Comlink proxy → id
const embindRegistry = new Map();
const embindProxyIds = new WeakMap();
let nextEmbindId = 1;

function registerEmbindObject(obj) {
    const id = nextEmbindId++;
    embindRegistry.set(id, obj);
    return id;
}

// Reorder transfer handlers for correct priority
const _proxyHandler = Comlink.transferHandlers.get('proxy');
const _throwHandler = Comlink.transferHandlers.get('throw');
Comlink.transferHandlers.clear();

// 1. embindProxy: when a proxied embind object is sent back as an argument,
//    resolve it to the original object on the worker instead of creating a proxy-of-proxy
Comlink.transferHandlers.set('embindProxy', {
    canHandle(obj) {
        return embindProxyIds.has(obj);
    },
    serialize(obj) {
        return [embindProxyIds.get(obj), []];
    },
    deserialize(id) {
        return embindRegistry.get(id);
    },
});

// 2. proxy (modified): also registers embind objects created via CONSTRUCT
Comlink.transferHandlers.set('proxy', {
    canHandle: _proxyHandler.canHandle,
    serialize(obj) {
        const [port, transferables] = _proxyHandler.serialize(obj);
        if (typeof obj.delete === 'function' && typeof obj.isDeleted === 'function') {
            const id = registerEmbindObject(obj);
            return [{ __embindId: id, __port: port }, transferables];
        }
        return [port, transferables];
    },
    deserialize(data) {
        if (data != null && typeof data === 'object' && '__embindId' in data) {
            const proxy = _proxyHandler.deserialize(data.__port);
            embindProxyIds.set(proxy, data.__embindId);
            return proxy;
        }
        return _proxyHandler.deserialize(data);
    },
});

// 3. throw (restored)
Comlink.transferHandlers.set('throw', _throwHandler);

// 4. embindVector: convert embind vectors to arrays across worker boundary
Comlink.transferHandlers.set('embindVector', {
    canHandle(obj) {
        return obj != null
            && typeof obj === 'object'
            && typeof obj.size === 'function'
            && typeof obj.get === 'function'
            && typeof obj.delete === 'function';
    },
    serialize(obj) {
        const len = obj.size();
        const elements = new Array(len);
        let hasObjects = false;
        for (let i = 0; i < len; i++) {
            const elem = obj.get(i);
            elements[i] = elem;
            if (!hasObjects && elem !== null && typeof elem === 'object') {
                hasObjects = true;
            }
        }
        if (!hasObjects) {
            return [elements, []];
        }
        const transferables = [];
        for (let i = 0; i < len; i++) {
            const elem = elements[i];
            if (elem !== null && typeof elem === 'object') {
                const id = registerEmbindObject(elem);
                const { port1, port2 } = new MessageChannel();
                Comlink.expose(elem, port1);
                transferables.push(port2);
                elements[i] = { __comlinkProxy: true, __embindId: id, port: port2 };
            }
        }
        return [elements, transferables];
    },
    deserialize(elements) {
        return elements.map(elem => {
            if (elem && typeof elem === 'object' && elem.__comlinkProxy) {
                elem.port.start();
                const proxy = Comlink.wrap(elem.port);
                embindProxyIds.set(proxy, elem.__embindId);
                return proxy;
            }
            return elem;
        });
    },
});

// 5. embindObject: proxy other embind objects (Dataset, etc.)
Comlink.transferHandlers.set('embindObject', {
    canHandle(obj) {
        return obj != null
            && typeof obj === 'object'
            && typeof obj.delete === 'function'
            && typeof obj.isDeleted === 'function';
    },
    serialize(obj) {
        const id = registerEmbindObject(obj);
        const { port1, port2 } = new MessageChannel();
        Comlink.expose(obj, port1);
        return [{ __embindId: id, port: port2 }, [port2]];
    },
    deserialize(data) {
        data.port.start();
        const proxy = Comlink.wrap(data.port);
        embindProxyIds.set(proxy, data.__embindId);
        return proxy;
    },
});

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

function createModule(config) {
    const locateFile = (fileName) => {
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
        }

        let output = prefix + path;
        if (output.endsWith('.data')) output += '.txt';
        if (output.substring(0, 4) !== 'http' && output[0] !== '/') output = `/${output}`;

        return output;
    };

    return new Promise((resolve, reject) => {
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
            mainScriptUrlOrBlob: locateFile(config.paths.worker),
            locateFile,
            preRun: [
                ({ ENV }) => {
                    if (ENV && config && config.env) {
                        Object.entries(config.env).forEach(([key, value]) => {
                            ENV[key] = value?.replace('_CPPJS_DATA_PATH_', `/cppjs`);
                        });
                    }
                },
            ],
            onRuntimeInitialized() {
                const appName = config.general?.name;
                try {
                    m.FS.mkdirTree(`${STATIC_PATHS.memfs}/${appName}/automounted`);
                } catch (e) {
                    console.error(e);
                }

                if (isWorkerScope && isBrowserSupportOPFS && config.fs?.opfs !== false && typeof m.cppjs_init_opfs === 'function') {
                    m.cppjs_init_opfs();
                    if (appName) {
                        const appDir = `${STATIC_PATHS.opfs}/${appName}/automounted`;
                        try {
                            m.FS.mkdirTree(appDir);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }

                if (config.onRuntimeInitialized) config.onRuntimeInitialized(m);
            },
            getDefaultPath() {
                return STATIC_PATHS[config.fs?.opfs !== false ? 'opfs' : 'memfs'];
            },
            getFinalPath(path) {
                let returnPath = path;
                if (!path.startsWith('/')) {
                    throw new Error(`Path ${path} does not start with /`);
                }

                const opfsConfigured = config.fs?.opfs !== false;

                let backend;
                Object.entries(STATIC_PATHS).forEach(([key, value]) => {
                    if (path.startsWith(value)) {
                        backend = key;
                    }
                });
                if (!backend) {
                    throw new Error(`Path ${path} does not start with any of the static paths: ${Object.values(STATIC_PATHS).join(', ')}`);
                }
                if (backend === 'opfs' && !opfsConfigured) {
                    throw new Error(`Path ${path} starts with ${STATIC_PATHS.opfs} but OPFS is disabled. Enable fs.opfs in config to mount under ${STATIC_PATHS.opfs}/.`);
                }
                if (backend === 'opfs' && !isWorkerScope) {
                    throw new Error(`Path ${path} starts with ${STATIC_PATHS.opfs} but OPFS is only available inside a Worker scope. Enable useWorker or mount under ${STATIC_PATHS.memfs}/ instead. Falling back to ${STATIC_PATHS.memfs}/.`);
                }
                if (backend === 'opfs' && !isBrowserSupportOPFS) {
                    console.error(`Path ${path} starts with ${STATIC_PATHS.opfs} but OPFS is not supported in this browser. Falling back to ${STATIC_PATHS.memfs}/.`);
                    returnPath = returnPath.replace(STATIC_PATHS.opfs, STATIC_PATHS.memfs);
                }

                return returnPath;
            },
            getRandomPath(startPath = m.getDefaultPath()) {
                const appName = config.general?.name;
                const rand = Math.floor(Math.random() * 1000000);
                const path = m.getFinalPath(`${startPath}/${appName}/automounted/${rand}`);
                m.FS.mkdirTree(path);
                return path;
            },
            unmount() { },
            autoMountFiles(files, parentPath = null) {
                return new Promise((resolve2, reject2) => {
                    if (files.length === 0) {
                        resolve2([]);
                        return;
                    }

                    const mountPath = parentPath ? m.getFinalPath(parentPath) : m.getRandomPath();
                    m.FS.mkdirTree(mountPath);

                    /* Promise.all([...files].map((f) => f.arrayBuffer())).then((buffers) => {
                        buffers.forEach((buffer, i) => {
                            m.FS.writeFile(`${mountPath}/${files[i].name}`, new Uint8Array(buffer));
                        });
                        resolve2([...files].map((f) => `${mountPath}/${f.name}`));
                    }).catch(reject2); */
                    (async () => {
                        try {
                            const paths = [];
                            for (const f of files) {
                                const filePath = `${mountPath}/${f.name}`;
                                const stream = m.FS.open(filePath, "w");
                                const reader = f.stream().getReader();
                                let offset = 0;

                                while (true) {
                                    const { done, value } = await reader.read();
                                    if (done) break;
                                    m.FS.write(stream, value, 0, value.length, offset);
                                    offset += value.length;
                                    // value (Uint8Array chunk) burada scope'tan çıkıp GC'ye bırakılır
                                }

                                m.FS.close(stream);
                                paths.push(filePath);
                            }
                            resolve2(paths);
                        } catch (e) {
                            reject2(e);
                        }
                    })();
                });
            },
            getFileBytes(path) {
                if (!path) return new Uint8Array();
                return m.FS.readFile(path, { encoding: 'binary' });
            },
            getFileList(path = m.getDefaultPath()) {
                const fileList = [];
                for (const name of m.FS.readdir(path)) {
                    if (name === '.' || name === '..') continue;
                    const fullPath = path === '/' ? `/${name}` : `${path}/${name}`;
                    const stat = m.FS.stat(fullPath);
                    const type = stat.mode & 0o170000;
                    if (type === 0o040000) {
                        fileList.push(...m.getFileList(fullPath));
                    } else if (type === 0o100000) {
                        fileList.push({ path: fullPath, size: stat.size });
                    }
                }
                return fileList;
            },
            toArray(vector) {
                if (Array.isArray(vector)) return vector;
                const len = vector.size();
                const output = new Array(len);
                for (let i = 0; i < len; i += 1) {
                    output[i] = vector.get(i);
                }
                return output;
            },
            toVector(classOrName, array = []) {
                const VectorClass = typeof classOrName === 'string' ? m[classOrName] : classOrName;
                const vector = new VectorClass();
                array.forEach((item) => {
                    vector.push_back(item);
                });
                return vector;
            },
            _createVector(className, array = []) {
                const vector = m.toVector(className, array);
                return Comlink.proxy(vector);
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
}

// === Worker Context: expose WASM module via Comlink ===
if (isWorkerScope) {
    const workerApi = {
        async init(userConfig = {}) {
            const config = mergeDeep(systemConfig, userConfig);
            const m = await createModule(config);
            return Comlink.proxy(m);
        },
    };
    Comlink.expose(workerApi);
}

// === Main Thread ===
let _worker = null;

function initCppJs(userConfig = {}) {
    if (cppJsPromise) return cppJsPromise;

    const config = mergeDeep(systemConfig, userConfig);

    if (config.useWorker) {
        cppJsPromise = initWithWorker(config, userConfig);
    } else {
        cppJsPromise = createModule(config);
    }

    return cppJsPromise;
}

async function initWithWorker(config, userConfig) {
    const scriptUrl = config.workerUrl || resolveScriptUrl(config);
    _worker = new Worker(scriptUrl);
    const workerApi = Comlink.wrap(_worker);

    // Functions can't be serialized across worker boundary
    const { logHandler, errorHandler, onRuntimeInitialized, getWasmFunction, useWorker, workerUrl, ...serializableConfig } = userConfig;
    const module = await workerApi.init(serializableConfig);

    return new Proxy(module, {
        get(target, prop) {
            if (prop === 'toArray') {
                return function toArray(vector) {
                    if (Array.isArray(vector)) return vector;
                    return target.toArray(vector);
                };
            }
            if (prop === 'toVector') {
                return function toVector(classOrName, array = []) {
                    if (typeof classOrName === 'string') {
                        return target._createVector(classOrName, array);
                    }
                    return target.toVector(classOrName, array);
                };
            }
            return target[prop];
        },
    });
}

function resolveScriptUrl(config) {
    const fileName = config.paths.js || config.paths.worker;
    let prefix = '';
    if (config.path) {
        prefix = config.path;
        if (prefix.slice(-1) !== '/') prefix += '/';
    }
    let output = prefix + fileName;
    if (output.substring(0, 4) !== 'http' && output[0] !== '/') output = `/${output}`;
    return output;
}

initCppJs.terminate = function terminate() {
    if (_worker) {
        _worker.terminate();
        _worker = null;
        cppJsPromise = null;
    }
};

if (typeof globalThis === 'object') {
    globalThis.CppJs = {
        initCppJs,
    };
}

export default initCppJs;
