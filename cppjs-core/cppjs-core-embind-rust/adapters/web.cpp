// WEB adapter: stable flat C-ABI -> emscripten embind (passthrough, 10-param identical), plus
// the host-specific typeid getters. Registration fires from the producer crate's init-array
// (embind_rs::bindings!), so there is no C++ trigger here - the shim is getters + passthroughs.
#include "../include/cppjs_embind.h"
#include <emscripten/bind.h>
#include <emscripten/em_js.h>
#include <emscripten/val.h>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <optional>
#include <string>
#include <typeinfo>
#include <unordered_set>

// Producer error escape (embind_rs::raise_err): decode the [u32 len][bytes] message, free it,
// and throw a real JS Error from inside the invoker - it propagates to the JS caller unchanged.
EM_JS(void, cppjs_embind_raise_error, (uint8_t* w), {
    const len = HEAPU32[w >> 2];
    const msg = UTF8ToString(w + 4, len);
    _free(w);
    throw new Error(msg);
});

// Producer sig chars that emscripten's dynCall alphabet lacks: 's' (a jsi-marshalling hint;
// the wasm string wire is a real pointer) -> 'p', and 'u' (unsigned 64 - signedness lives in
// the registered typeid) -> 'j'. Translated copies are one-time registration data, leaked.
static const char* sigForWasm(const char* sig) {
    if (!sig || (!std::strchr(sig, 's') && !std::strchr(sig, 'u'))) return sig;
    char* copy = strdup(sig);
    for (char* c = copy; *c; ++c) {
        if (*c == 's') *c = 'p';
        else if (*c == 'u') *c = 'j';
    }
    return copy;
}

extern "C" {

// Primitive type keys: bridge to the builtin typeids emscripten registered.
const void* cppjs_tid_int() { return &typeid(int); }
const void* cppjs_tid_double() { return &typeid(double); }
const void* cppjs_tid_bool() { return &typeid(bool); }
const void* cppjs_tid_void() { return &typeid(void); }
const void* cppjs_tid_std_string() { return &typeid(std::string); }
const void* cppjs_tid_int64() { return &typeid(int64_t); }
const void* cppjs_tid_uint64() { return &typeid(uint64_t); }
// Adapter-local identities, NOT &typeid(std::optional<T>): linked C++ bindings may register
// the real optional typeids themselves, and these types never interop with C++ signatures.
const void* cppjs_tid_optional_int() { static const char t = 0; return &t; }
const void* cppjs_tid_optional_double() { static const char t = 0; return &t; }
const void* cppjs_tid_optional_bool() { static const char t = 0; return &t; }
const void* cppjs_tid_optional_string() { static const char t = 0; return &t; }

}

// Optional wire on wasm is an EM_VAL handle (None = the reserved undefined constant from
// emscripten's own header). Some-values become handles through Emval.toHandle; the registered
// optional type's fromWireType does toValue + decref, so the refcount stays balanced.
EM_JS(void*, cppjs_emval_from_number_js, (double v), { return Emval.toHandle(v); });
EM_JS(void*, cppjs_emval_from_bool_js, (int v), { return Emval.toHandle(!!v); });
EM_JS(void*, cppjs_emval_from_string_js, (uint8_t* w), {
    const len = HEAPU32[w >> 2];
    const s = UTF8ToString(w + 4, len);
    _free(w);
    return Emval.toHandle(s);
});

extern "C" {
void* cppjs_emval_take_value(CppjsTid inner, const void* argv) {
    if (inner == cppjs_tid_int()) return cppjs_emval_from_number_js((double)*(const int32_t*)argv);
    if (inner == cppjs_tid_double()) return cppjs_emval_from_number_js(*(const double*)argv);
    if (inner == cppjs_tid_bool()) return cppjs_emval_from_bool_js((int)*(const uint8_t*)argv);
    return cppjs_emval_from_string_js(*(uint8_t* const*)argv);  // std::string wire pointer
}
void* cppjs_emval_undefined() {
    return (void*)emscripten::internal::_EMVAL_UNDEFINED;
}

// Optional PARAMETERS: embind hands the invoker an EM_VAL handle; these readers consume its
// reference (take_ownership) and yield the native repr, 0 for undefined/null.
int cppjs_emval_opt_i32(void* h, int32_t* out) {
    emscripten::val v = emscripten::val::take_ownership((emscripten::EM_VAL)h);
    if (v.isUndefined() || v.isNull()) return 0;
    *out = v.as<int32_t>();
    return 1;
}
int cppjs_emval_opt_f64(void* h, double* out) {
    emscripten::val v = emscripten::val::take_ownership((emscripten::EM_VAL)h);
    if (v.isUndefined() || v.isNull()) return 0;
    *out = v.as<double>();
    return 1;
}
int cppjs_emval_opt_bool(void* h, uint8_t* out) {
    emscripten::val v = emscripten::val::take_ownership((emscripten::EM_VAL)h);
    if (v.isUndefined() || v.isNull()) return 0;
    *out = v.as<bool>() ? 1 : 0;
    return 1;
}
int cppjs_emval_opt_string(void* h, uint8_t** out) {
    emscripten::val v = emscripten::val::take_ownership((emscripten::EM_VAL)h);
    if (v.isUndefined() || v.isNull()) return 0;
    std::string s = v.as<std::string>();
    uint8_t* w = (uint8_t*)malloc(4 + s.size());
    uint32_t len = (uint32_t)s.size();
    std::memcpy(w, &len, 4);
    std::memcpy(w + 4, s.data(), s.size());
    *out = w;
    return 1;
}

// JSON-value bridge (serde_json::Value): deep copy through the host's canonical JSON codec.
// Wire is the usual [u32 len][bytes]; handles cross owned (incref on give, take_ownership on
// receive), matching the Option emval discipline above.
const void* cppjs_tid_emval() { return &typeid(emscripten::val); }

void* cppjs_emval_json_to_handle(uint8_t* w) {
    const uint32_t len = *(const uint32_t*)w;
    std::string s((const char*)(w + 4), len);
    free(w);
    emscripten::val v = emscripten::val::global("JSON").call<emscripten::val>("parse", emscripten::val::u8string(s.c_str()));
    emscripten::EM_VAL h = v.as_handle();
    emscripten::internal::_emval_incref(h);
    return (void*)h;
}

uint8_t* cppjs_emval_handle_to_json(void* h) {
    emscripten::val v = emscripten::val::take_ownership((emscripten::EM_VAL)h);
    emscripten::val j = emscripten::val::global("JSON").call<emscripten::val>("stringify", v);
    // JSON.stringify(undefined / a bare function) yields undefined: cross as null.
    std::string s = j.isUndefined() ? "null" : j.as<std::string>();
    uint8_t* w = (uint8_t*)malloc(4 + s.size());
    uint32_t len = (uint32_t)s.size();
    std::memcpy(w, &len, 4);
    std::memcpy(w + 4, s.data(), s.size());
    return w;
}

// emscripten's real registration functions (extern "C" in bind.h).
void _embind_register_class(CppjsTid, CppjsTid, CppjsTid, CppjsTid, const char*, CppjsFn, const char*, CppjsFn, const char*, CppjsFn, const char*, const char*, CppjsFn);
void _embind_register_class_constructor(CppjsTid, unsigned, const CppjsTid*, const char*, CppjsFn, CppjsFn);
void _embind_register_class_function(CppjsTid, const char*, unsigned, const CppjsTid*, const char*, CppjsFn, void*, unsigned, bool, bool);
void _embind_register_class_class_function(CppjsTid, const char*, unsigned, const CppjsTid*, const char*, CppjsFn, CppjsFn, bool, bool);
void _embind_register_function(const char*, unsigned, const CppjsTid*, const char*, CppjsFn, CppjsFn, bool, bool);
void _embind_register_optional(CppjsTid, CppjsTid);
void _embind_register_smart_ptr(CppjsTid, CppjsTid, const char*, emscripten::sharing_policy, const char*, CppjsFn, const char*, CppjsFn, const char*, CppjsFn, const char*, CppjsFn);
void _embind_register_enum(CppjsTid, const char*, size_t, bool, int);
void _embind_register_enum_value(CppjsTid, const char*, int);
void _embind_register_value_object(CppjsTid, const char*, const char*, CppjsFn, const char*, CppjsFn);
void _embind_register_value_object_field(CppjsTid, const char*, CppjsTid, const char*, CppjsFn, void*, CppjsTid, const char*, CppjsFn, void*);
void _embind_finalize_value_object(CppjsTid);

void cppjs_embind_register_class(CppjsTid a, CppjsTid b, CppjsTid c, CppjsTid d, const char* e, CppjsFn f, const char* g, CppjsFn h, const char* i, CppjsFn j, const char* k, const char* l, CppjsFn m) {
    _embind_register_class(a, b, c, d, e, f, g, h, i, j, k, l, m);
}
void cppjs_embind_register_class_constructor(CppjsTid a, unsigned b, const CppjsTid* c, const char* d, CppjsFn e, CppjsFn f) {
    _embind_register_class_constructor(a, b, c, sigForWasm(d), e, f);
}
void cppjs_embind_register_class_function(CppjsTid a, const char* b, unsigned c, const CppjsTid* d, const char* e, CppjsFn f, void* g, unsigned h, bool i, bool j) {
    _embind_register_class_function(a, b, c, d, sigForWasm(e), f, g, h, i, j);  // 10-param, identical
}
void cppjs_embind_register_class_class_function(CppjsTid a, const char* b, unsigned c, const CppjsTid* d, const char* e, CppjsFn f, CppjsFn g, bool h, bool i) {
    _embind_register_class_class_function(a, b, c, d, sigForWasm(e), f, g, h, i);
}
void cppjs_embind_register_function(const char* a, unsigned b, const CppjsTid* c, const char* d, CppjsFn e, CppjsFn f, bool g, bool h) {
    _embind_register_function(a, b, c, sigForWasm(d), e, f, g, h);
}
// Idempotent: every Rust archive in the link may ask for the same optional type.
void cppjs_embind_register_optional(CppjsTid opt, CppjsTid inner) {
    static std::unordered_set<CppjsTid> registered;
    if (!registered.insert(opt).second) return;
    _embind_register_optional(opt, inner);
}
void cppjs_embind_register_smart_ptr(CppjsTid a, CppjsTid b, const char* c, int d, const char* e, CppjsFn f, const char* g, CppjsFn h, const char* i, CppjsFn j, const char* k, CppjsFn l) {
    _embind_register_smart_ptr(a, b, c, (emscripten::sharing_policy)d, e, f, g, h, i, j, k, l);
}
void cppjs_embind_register_enum(CppjsTid a, const char* b, size_t c, bool d, int e) {
    _embind_register_enum(a, b, c, d, e);
}
void cppjs_embind_register_enum_value(CppjsTid a, const char* b, int c) {
    _embind_register_enum_value(a, b, c);
}
void cppjs_embind_register_value_object(CppjsTid a, const char* b, const char* c, CppjsFn d, const char* e, CppjsFn f) {
    _embind_register_value_object(a, b, c, d, e, f);
}
void cppjs_embind_register_value_object_field(CppjsTid a, const char* b, CppjsTid c, const char* d, CppjsFn e, void* f, CppjsTid g, const char* h, CppjsFn i, void* j) {
    _embind_register_value_object_field(a, b, c, sigForWasm(d), e, f, g, sigForWasm(h), i, j);
}
void cppjs_embind_finalize_value_object(CppjsTid a) {
    _embind_finalize_value_object(a);
}

// emscripten's InitFunc constructor runs the init immediately and registers it for workers.
// Leaked on purpose: it lives for the program.
void cppjs_embind_register_bindings(void (*init)()) {
    new emscripten::internal::InitFunc(init);
}

}

// ---- live JS value hooks (JsValue / JsFunction) ----
// EM_JS bodies over embind's own Emval handle table (visible in EM_JS scope, like the Option
// helpers above). Handles are i32 table indexes on wasm32, so argv reads via HEAPU32.
EM_JS(void, cppjs_v_ref, (void* h), { __emval_incref(h); });
EM_JS(void, cppjs_v_unref, (void* h), { __emval_decref(h); });
EM_JS(void*, cppjs_v_from_f64, (double v), { return Emval.toHandle(v); });
EM_JS(void*, cppjs_v_from_bool, (int v), { return Emval.toHandle(!!v); });
EM_JS(void*, cppjs_v_from_str, (uint8_t* w), {
    const len = HEAPU32[w >> 2];
    const s = UTF8ToString(w + 4, len);
    _free(w);
    return Emval.toHandle(s);
});
EM_JS(void*, cppjs_v_get_prop, (void* h, uint8_t* w), {
    const len = HEAPU32[w >> 2];
    const k = UTF8ToString(w + 4, len);
    _free(w);
    return Emval.toHandle(Emval.toValue(h)[k]);
});
EM_JS(void, cppjs_v_set_prop, (void* h, uint8_t* w, void* v), {
    const len = HEAPU32[w >> 2];
    const k = UTF8ToString(w + 4, len);
    _free(w);
    Emval.toValue(h)[k] = Emval.toValue(v);
});
EM_JS(int, cppjs_v_kind, (void* h), {
    const v = Emval.toValue(h);
    if (v === null || v === undefined) return 0;
    const t = typeof v;
    if (t === 'boolean') return 1;
    if (t === 'number') return 2;
    if (t === 'string') return 3;
    if (t === 'function') return 4;
    return 5;
});
EM_JS(double, cppjs_v_as_f64, (void* h), { return Number(Emval.toValue(h)); });
EM_JS(int, cppjs_v_as_bool, (void* h), { return Emval.toValue(h) ? 1 : 0; });
EM_JS(uint8_t*, cppjs_v_as_str, (void* h), {
    const s = String(Emval.toValue(h));
    const len = lengthBytesUTF8(s);
    const w = _malloc(4 + len);
    HEAPU32[w >> 2] = len;
    stringToUTF8(s, w + 4, len + 1);
    return w;
});
EM_JS(void*, cppjs_v_call, (void* f, unsigned argc, void* argv), {
    try {
        const fn = Emval.toValue(f);
        const args = [];
        for (let i = 0; i < argc; i += 1) args.push(Emval.toValue(HEAPU32[(argv >> 2) + i]));
        return Emval.toHandle(fn(...args));
    } catch (e) {
        globalThis.__cppjs_cb_err = String((e && e.message) || e);
        return 0;
    }
});
EM_JS(uint8_t*, cppjs_v_cb_err_take, (), {
    const s = globalThis.__cppjs_cb_err;
    if (s === undefined) return 0;
    delete globalThis.__cppjs_cb_err;
    const len = lengthBytesUTF8(s);
    const w = _malloc(4 + len);
    HEAPU32[w >> 2] = len;
    stringToUTF8(s, w + 4, len + 1);
    return w;
});

extern "C" void* cppjs_v_undef() { return (void*)emscripten::internal::_EMVAL_UNDEFINED; }
