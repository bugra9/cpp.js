import * as Comlink from 'comlink';
import { mergeDeep } from '../core.js';

const isWorkerScope = typeof WorkerGlobalScope !== 'undefined'
    && typeof self !== 'undefined'
    && self instanceof WorkerGlobalScope;

// === Embind <-> Comlink Bridge ===
// Worker-side registry: id -> original embind object
// Main-thread registry: Comlink proxy -> id
const embindRegistry = new Map();
const embindProxyIds = new WeakMap();
let nextEmbindId = 1;

function registerEmbindObject(obj) {
    const id = nextEmbindId++;
    embindRegistry.set(id, obj);
    return id;
}

// === Plain array -> embind vector coercion ===
// Vectors RETURNED across the worker boundary arrive as plain arrays (see the
// embindVector handler below), so callers naturally try to pass plain arrays
// back as vector PARAMETERS - which embind rejects with
// 'Cannot pass "..." as a VectorX'. Every worker-side invocation goes through
// callWithVectorCoercion: when that error names a registered Vector class and
// a plain-array argument remains, the first remaining array is converted with
// Module.toVector and the call retried, so mixed signatures (VectorDataset +
// VectorString, ...) resolve left to right, matching embind's argument order.
// embind passes std::vector parameters by value, so the temporaries are
// deleted after the call instead of leaking wasm memory.
let coercionModule = null;

const EXPECTED_VECTOR_RE = /as a (Vector\w+)\b/;

function setCoercionModule(m) {
    coercionModule = m;
}

function callWithVectorCoercion(fn, thisArg, args) {
    const temp = [];
    const cleanup = () => {
        for (const v of temp) {
            try {
                v.delete();
            } catch (e) { /* already deleted by the callee */ }
        }
    };
    const current = args.slice();
    for (;;) {
        let result;
        try {
            result = Reflect.apply(fn, thisArg, current);
        } catch (e) {
            const match = EXPECTED_VECTOR_RE.exec(String((e && e.message) || e));
            const VectorClass = match && coercionModule ? coercionModule[match[1]] : undefined;
            const index = current.findIndex((a) => Array.isArray(a));
            if (typeof VectorClass !== 'function' || index < 0) {
                cleanup();
                throw e;
            }
            let vector;
            try {
                vector = coercionModule.toVector(VectorClass, current[index]);
            } catch (convError) {
                cleanup();
                throw e;
            }
            temp.push(vector);
            current[index] = vector;
            continue;
        }
        if (temp.length && result && typeof result.then === 'function') {
            // Async (JSPI-style) binding: arguments were already converted
            // synchronously, but hold the temporaries until it settles.
            return result.then(
                (value) => {
                    cleanup();
                    return value;
                },
                (err) => {
                    cleanup();
                    throw err;
                },
            );
        }
        cleanup();
        return result;
    }
}

// Wraps a worker-side object so every method reached through it (at any
// depth: Module.Gdal.openEx, dataset.translate, ...) is invoked through
// callWithVectorCoercion. Constructors pass through untouched.
function wrapWithVectorCoercion(value, thisArg) {
    if (value == null || (typeof value !== 'object' && typeof value !== 'function')) {
        return value;
    }
    return new Proxy(value, {
        get(target, prop) {
            const member = Reflect.get(target, prop);
            if (typeof member === 'function' || (member !== null && typeof member === 'object')) {
                // Proxy invariant: non-configurable, non-writable data
                // properties (a class's .prototype, notably) must be returned
                // as-is, or the engine throws on access.
                const desc = Reflect.getOwnPropertyDescriptor(target, prop);
                if (desc && desc.configurable === false && desc.writable === false) {
                    return member;
                }
                return wrapWithVectorCoercion(member, target);
            }
            return member;
        },
        apply(target, applyThis, args) {
            return callWithVectorCoercion(target, thisArg !== undefined ? thisArg : applyThis, args);
        },
    });
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
                Comlink.expose(wrapWithVectorCoercion(elem), port1);
                transferables.push(port2);
                elements[i] = { __comlinkProxy: true, __embindId: id, port: port2 };
            }
        }
        return [elements, transferables];
    },
    deserialize(elements) {
        return elements.map((elem) => {
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
        Comlink.expose(wrapWithVectorCoercion(obj), port1);
        return [{ __embindId: id, port: port2 }, [port2]];
    },
    deserialize(data) {
        data.port.start();
        const proxy = Comlink.wrap(data.port);
        embindProxyIds.set(proxy, data.__embindId);
        return proxy;
    },
});

// 6. embindProxyArray: a plain JS array that contains proxied embind objects
//    can't be structured-cloned across the
//    worker boundary, because the element proxies are functions. Resolve each
//    registered proxy element back to its worker-side original, the same way the
//    embindProxy handler does for a single argument.
Comlink.transferHandlers.set('embindProxyArray', {
    canHandle(obj) {
        return Array.isArray(obj) && obj.some((e) => embindProxyIds.has(e));
    },
    serialize(arr) {
        return [
            arr.map((e) => (embindProxyIds.has(e) ? { __embindRef: embindProxyIds.get(e) } : e)),
            [],
        ];
    },
    deserialize(arr) {
        return arr.map((e) => (e != null && typeof e === 'object' && '__embindRef' in e
            ? embindRegistry.get(e.__embindRef)
            : e));
    },
});

let _worker = null;

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

function exposeWorker(systemConfig, createModule) {
    const workerApi = {
        async init(userConfig = {}) {
            const config = mergeDeep(systemConfig, userConfig);
            const m = await createModule(config);
            setCoercionModule(m);
            return Comlink.proxy(wrapWithVectorCoercion(m));
        },
    };
    Comlink.expose(workerApi);
}

async function initWithWorker(config, userConfig) {
    const scriptUrl = config.workerUrl || resolveScriptUrl(config);
    _worker = new Worker(scriptUrl);
    const workerApi = Comlink.wrap(_worker);

    const {
        // eslint-disable-next-line no-unused-vars
        logHandler, errorHandler, onRuntimeInitialized, getWasmFunction, useWorker, workerUrl,
        ...serializableConfig
    } = userConfig;
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

function terminate() {
    if (_worker) {
        _worker.terminate();
        _worker = null;
    }
}

export default {
    isWorkerScope,
    exposeWorker,
    initWithWorker,
    terminate,
};

export {
    isWorkerScope, exposeWorker, initWithWorker, terminate,
    // exported for unit tests
    callWithVectorCoercion, wrapWithVectorCoercion, setCoercionModule,
};
