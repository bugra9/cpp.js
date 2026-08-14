// === wasm-EH exception decoding (shared by the worker and direct runtimes) ===
// Builds link with -fwasm-exceptions, so an uncaught C++ exception reaches JS as a raw
// WebAssembly.Exception with no .message. The glue exports getExceptionMessage (via
// -sEXPORT_EXCEPTION_HANDLING_HELPERS), which decodes it back into [type, what()]. This
// adapter turns such values into real JS Errors at the binding boundary; anything else
// passes through untouched, so it is safe to apply on every call path.
let decodeModule = null;

export function setExceptionDecodeModule(m) {
    decodeModule = m;
}

export function decodeCppException(value) {
    const m = decodeModule;
    if (m == null
        || typeof m.getExceptionMessage !== 'function'
        || typeof WebAssembly === 'undefined'
        || typeof WebAssembly.Exception !== 'function'
        || !(value instanceof WebAssembly.Exception)) {
        return value;
    }
    try {
        const [type, message] = m.getExceptionMessage(value);
        const error = new Error(message ? `${type}: ${message}` : `${type}`);
        error.cppType = type;
        error.cppMessage = message;
        return error;
    } catch (decodeFailure) {
        return value;
    }
}

const STATIC_SKIP = new Set(['prototype', 'name', 'length', 'caller', 'arguments', 'argCount']);

function wrapOwnMethod(holder, name) {
    const desc = Object.getOwnPropertyDescriptor(holder, name);
    if (!desc || typeof desc.value !== 'function' || desc.writable === false) return;
    const original = desc.value;
    function decoded(...args) {
        let result;
        try {
            result = original.apply(this, args);
        } catch (e) {
            throw decodeCppException(e);
        }
        if (result && typeof result.then === 'function') {
            // Async (JSPI-style) binding: decode the rejection reason as well.
            return result.then(undefined, (e) => { throw decodeCppException(e); });
        }
        return result;
    }
    // Overload dispatch reads properties (e.g. overloadTable) off the exposed function.
    Object.assign(decoded, original);
    Object.defineProperty(holder, name, { ...desc, value: decoded });
}

// Direct (non-worker) mode exposes embind class instances raw, so a thrown C++ exception in
// an instance or static method never crosses a wrapper. Patching each bound class's
// prototype and statics once at module-ready keeps object identity intact (embind checks
// prototypes, not method identity) while every call site gains the decode.
export function patchModuleForExceptionDecode(m) {
    setExceptionDecodeModule(m);
    if (m == null || typeof m !== 'object') return m;
    for (const key of Object.keys(m)) {
        const Cls = m[key];
        if (typeof Cls !== 'function') continue;
        if (Cls.prototype) {
            // Static-only classes are common (pure class_function surfaces), so statics are
            // wrapped below regardless of whether the prototype carries any method.
            Object.getOwnPropertyNames(Cls.prototype)
                .filter((n) => n !== 'constructor')
                .forEach((n) => wrapOwnMethod(Cls.prototype, n));
        }
        Object.getOwnPropertyNames(Cls)
            .filter((n) => !STATIC_SKIP.has(n))
            .forEach((n) => wrapOwnMethod(Cls, n));
    }
    return m;
}
