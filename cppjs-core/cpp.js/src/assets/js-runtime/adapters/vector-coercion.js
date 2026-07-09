// === Plain array -> embind vector coercion (shared by the worker and direct runtimes) ===
// Vectors RETURNED across the worker boundary arrive as plain arrays, so callers naturally
// try to pass plain arrays back as vector PARAMETERS - which embind rejects with
// 'Cannot pass "..." as a VectorX'. Coercion catches that error, converts the first
// remaining plain-array argument with Module.toVector, and retries, so mixed signatures
// (VectorDataset + VectorString, ...) resolve left to right, matching embind's argument
// order. embind passes std::vector parameters by value, so the temporaries are deleted
// after the call instead of leaking wasm memory.
//
// This is a REACTIVE strategy: embind does not expose parameter types to JS, so we can
// only learn that an argument should have been a vector from the failed call. See
// EXPECTED_VECTOR_RE below - the coercion silently disengages (rethrows) if embind ever
// changes that message, which the canary test in vectorCoercion.test.js guards against.
let coercionModule = null;

// Matches embind's "Cannot pass <value> as a VectorX" BindingError message.
const EXPECTED_VECTOR_RE = /as a (Vector\w+)\b/;

export function setCoercionModule(m) {
    coercionModule = m;
}

// Proxies created by the coercion wrappers, mapped back to their raw targets. embind
// rejects a proxied `this` or argument (its class checks compare $$.ptrType.registeredClass
// by identity), so every invocation unwraps them back to the raw objects first.
const coercionProxies = new WeakMap();

export function unwrapCoercionProxy(value) {
    const raw = coercionProxies.get(value);
    return raw === undefined ? value : raw;
}

// The retry-on-vector-error loop shared by call and construct. `invoke(args)` performs the
// actual apply/construct; on a 'Cannot pass ... as a VectorX' error that names a registered
// Vector class while a plain-array argument remains, the first remaining array is converted
// with Module.toVector and the invocation retried. Each retry converts exactly one array, so
// the array count strictly decreases and the loop always terminates.
function retryWithCoercion(invoke, args) {
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
            result = invoke(current);
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
            // Async (JSPI-style) binding: arguments were already converted synchronously,
            // but hold the temporaries until it settles.
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

export function callWithVectorCoercion(fn, thisArg, args) {
    return retryWithCoercion((current) => Reflect.apply(fn, thisArg, current), args);
}

export function constructWithVectorCoercion(Class, args, newTarget) {
    return retryWithCoercion((current) => Reflect.construct(Class, current, newTarget || Class), args);
}

// Deep wrapper (WORKER mode): every method reached through the wrapped object - at any depth
// (Module.Gdal.openEx, dataset.translate, ...) - is invoked through callWithVectorCoercion,
// and every `new` through the construct trap below. Safe here because the worker world is
// entirely opaque Comlink proxies - nothing accesses raw memory or object identity through it.
export function wrapWithVectorCoercion(value, thisArg) {
    if (value == null || (typeof value !== 'object' && typeof value !== 'function')) {
        return value;
    }
    const proxy = new Proxy(value, {
        get(target, prop) {
            const member = Reflect.get(target, prop);
            // Comlink invokes exposed methods as rawValue.apply(parent, args) with parent
            // being the WRAPPED object. Handle Function.prototype apply/call here so `this`
            // and the argument list reach callWithVectorCoercion unwrapped and flat (retries
            // depend on seeing the real argument positions).
            if (typeof target === 'function' && member === Function.prototype.apply) {
                return (applyThis, applyArgs) => callWithVectorCoercion(
                    target,
                    applyThis === undefined && thisArg !== undefined
                        ? thisArg
                        : unwrapCoercionProxy(applyThis),
                    applyArgs ? Array.prototype.map.call(applyArgs, unwrapCoercionProxy) : [],
                );
            }
            if (typeof target === 'function' && member === Function.prototype.call) {
                return (callThis, ...callArgs) => callWithVectorCoercion(
                    target,
                    callThis === undefined && thisArg !== undefined
                        ? thisArg
                        : unwrapCoercionProxy(callThis),
                    callArgs.map(unwrapCoercionProxy),
                );
            }
            if (typeof member === 'function' || (member !== null && typeof member === 'object')) {
                // Proxy invariant: non-configurable, non-writable data properties (a class's
                // .prototype, notably) must be returned as-is, or the engine throws on access.
                const desc = Reflect.getOwnPropertyDescriptor(target, prop);
                if (desc && desc.configurable === false && desc.writable === false) {
                    return member;
                }
                return wrapWithVectorCoercion(member, target);
            }
            return member;
        },
        apply(target, applyThis, args) {
            const boundThis = thisArg !== undefined ? thisArg : unwrapCoercionProxy(applyThis);
            return callWithVectorCoercion(target, boundThis, args.map(unwrapCoercionProxy));
        },
        construct(target, args) {
            // Comlink's CONSTRUCT handler does `new rawValue(...args)` on the wrapped
            // class. Without this trap the construction falls through with the PROXY as
            // newTarget, whose get trap hands out a wrapped .prototype (embind classes
            // are plain functions, so their prototype is writable and the proxy
            // invariant early-return does not apply) - and embind's prototype-identity
            // check rejects the instance with "Use 'new' to construct X". Constructing
            // against the raw class keeps the real prototype and adds the same
            // plain-array vector coercion that method calls get.
            return constructWithVectorCoercion(target, args.map(unwrapCoercionProxy));
        },
    });
    coercionProxies.set(proxy, value);
    return proxy;
}

// Narrow wrapper (DIRECT / non-worker mode): only the module's own function calls and
// constructions are coerced. Data members (HEAP*, FS, typed arrays) and returned objects
// stay raw, because direct-mode code accesses those by index and by identity - a blanket
// proxy (like the worker wrapper above) would break them. Returned embind objects are
// already real vectors/objects in direct mode (they are not flattened to plain arrays the
// way the worker boundary does), so module-level coercion covers the plain-array-literal
// case without changing any object's identity.
export function wrapModuleForCoercion(m) {
    if (m == null || (typeof m !== 'object' && typeof m !== 'function')) {
        return m;
    }
    const wrappedFns = new Map();
    const moduleProxy = new Proxy(m, {
        get(target, prop) {
            const member = Reflect.get(target, prop);
            if (typeof member !== 'function') {
                return member; // HEAP*, FS, typed arrays and other data pass through raw
            }
            let wrapped = wrappedFns.get(prop);
            if (!wrapped) {
                wrapped = new Proxy(member, {
                    apply(fn, thisArg, args) {
                        return callWithVectorCoercion(
                            fn,
                            unwrapCoercionProxy(thisArg),
                            args.map(unwrapCoercionProxy),
                        );
                    },
                    construct(Class, args) {
                        return constructWithVectorCoercion(Class, args.map(unwrapCoercionProxy));
                    },
                });
                wrappedFns.set(prop, wrapped);
            }
            return wrapped;
        },
    });
    coercionProxies.set(moduleProxy, m);
    return moduleProxy;
}
