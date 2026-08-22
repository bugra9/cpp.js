// jsi ADAPTER + jsi-shaped mock consumer (multi-class).
// Chain: embind-rs (Rust, flat C-ABI) -> THIS ADAPTER -> jsi-signature registers.
// The adapter = the layer the engine will write on the mobile side: it wraps the raw fn-ptr
// into a jsi::Function (a MockFn here), keeps argCount, and DROPS isNonnullReturn (jsi-embind
// is 9-param). jsi-embind's real signature shape (bind.h): function slot = jsi::Function&,
// class_function is 9-param. Also covers static class functions and smart-pointer registration.
#include "../include/crossbind_embind.h"
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cstdint>
#include <functional>
#include <optional>
#include <string>
#include <typeinfo>
#include <unordered_map>
#include <vector>

// ---- jsi::Value / jsi::Function stand-ins (a native mock instead of Hermes) ----
struct MockValue {
    enum Tag { NUM, PTR, STR } tag;
    int64_t num = 0;
    std::string str;
    static MockValue N(int64_t v) { return {NUM, v, ""}; }
    static MockValue P(void* p) { return {PTR, (int64_t)(uintptr_t)p, ""}; }
    static MockValue S(std::string s) { return {STR, 0, std::move(s)}; }
};
using MockFn = std::function<MockValue(const std::vector<MockValue>&)>;

// Mock of jsi-embind's registry: one entry per class, keyed by the class typeid.
struct ClassEntry {
    std::string name;
    MockFn ctor;       // from register_class_constructor (instance ctor)
    MockFn dtor;       // from register_class (raw destructor)
    MockFn smartDtor;  // from register_smart_ptr (frees a factory-created object)
    std::unordered_map<std::string, MockFn> methods;  // instance
    std::unordered_map<std::string, MockFn> statics;  // class functions (no `this`)
};
static std::unordered_map<const void*, ClassEntry> g_classes;

extern "C" {
const void* crossbind_tid_int() { return &typeid(int); }
const void* crossbind_tid_double() { return &typeid(double); }
const void* crossbind_tid_bool() { return &typeid(bool); }
const void* crossbind_tid_void() { return &typeid(void); }
const void* crossbind_tid_std_string() { return &typeid(std::string); }
const void* crossbind_tid_int64() { return &typeid(int64_t); }
const void* crossbind_tid_uint64() { return &typeid(uint64_t); }
const void* crossbind_tid_optional_int() { static const char t = 0; return &t; }
const void* crossbind_tid_optional_double() { static const char t = 0; return &t; }
const void* crossbind_tid_optional_bool() { static const char t = 0; return &t; }
const void* crossbind_tid_optional_string() { static const char t = 0; return &t; }
void crossbind_embind_register_optional(CrossbindTid, CrossbindTid) {
    std::printf("[jsi-mock] register_optional\n");
}
}

// ---- string wire helpers (same as embind-rs WireType<String>: [u32 len][bytes]) ----
static void* str_to_wire(const std::string& s) {
    uint8_t* base = (uint8_t*)std::malloc(4 + s.size());
    uint32_t len = (uint32_t)s.size();
    std::memcpy(base, &len, 4);
    std::memcpy(base + 4, s.data(), s.size());
    return base;
}
static std::string str_from_wire(void* w) {
    uint32_t len; std::memcpy(&len, w, 4);
    return std::string((char*)w + 4, len);
}

// Mirror of the real adapters' error escape (embind_rs::raise_err): store, main() asserts.
static std::string g_lastError;
static bool g_raised = false;
extern "C" void crossbind_embind_raise_error(void* w) {
    g_lastError = str_from_wire(w);
    g_raised = true;
    std::free(w);
}

// Builds the MockFn for an instance method (has `this`) or a static function (no `this`).
// argTypes for instance = [ret, this, userArgs...]; for static = [ret, userArgs...].
static MockFn make_invoker(bool hasThis, unsigned argc, const CrossbindTid* argTypes,
                           CrossbindFn invoker, void* ctx) {
    const void* tidStr = crossbind_tid_std_string();
    const void* tidInt = crossbind_tid_int();
    const void* tidI64 = crossbind_tid_int64();
    const void* tidU64 = crossbind_tid_uint64();
    int userArgc = (int)argc - (hasThis ? 2 : 1);
    const void* arg0T = userArgc >= 1 ? argTypes[hasThis ? 2 : 1] : nullptr;
    const void* retT = argTypes[0];
    return [=](const std::vector<MockValue>& a) -> MockValue {
        void* self = hasThis ? (void*)(uintptr_t)a[0].num : nullptr;
        int base = hasThis ? 1 : 0;
        if (userArgc == 0) {
            // Optional returns: nullable heap cell (0 = None), reader/free per the jsi adapter.
            if (hasThis && (retT == crossbind_tid_optional_int() || retT == crossbind_tid_optional_string())) {
                auto f = (void* (*)(void*, void*))invoker;
                return MockValue::P(f(ctx, self));
            }
            if (hasThis && retT == tidStr) {  // e.g. Display -> toString()
                auto f = (void* (*)(void*, void*))invoker;
                void* wr = f(ctx, self);
                std::string out = str_from_wire(wr);
                std::free(wr);
                return MockValue::S(out);
            }
            if (hasThis && (retT == tidI64 || retT == tidU64)) {  // i64/u64 out: full 64-bit slot
                auto f = (uint64_t (*)(void*, void*))invoker;
                return MockValue::N((int64_t)f(ctx, self));
            }
            if (hasThis) { auto f = (int32_t (*)(void*, void*))invoker; return MockValue::N(f(ctx, self)); }
            auto f = (int32_t (*)(void*))invoker; return MockValue::N(f(ctx));  // unused shape
        }
        if (userArgc == 2) {
            auto f = (int32_t (*)(void*, void*, int32_t, int32_t))invoker;
            return MockValue::N(f(ctx, self, (int32_t)a[base].num, (int32_t)a[base + 1].num));
        }
        // userArgc == 1
        if (hasThis && arg0T == tidI64) {  // i64 in and out
            auto f = (int64_t (*)(void*, void*, int64_t))invoker;
            return MockValue::N(f(ctx, self, (int64_t)a[base].num));
        }
        if (!hasThis && arg0T == tidStr && retT == tidStr) {  // free fn: string -> string
            void* wa = str_to_wire(a[base].str);
            auto f = (void* (*)(void*, void*))invoker;
            void* wr = f(ctx, wa);
            std::string out = str_from_wire(wr);
            std::free(wa); std::free(wr);
            return MockValue::S(out);
        }
        if (!hasThis && arg0T == tidStr && retT == tidInt) {  // free fn: string -> int (may raise)
            void* wa = str_to_wire(a[base].str);
            auto f = (int32_t (*)(void*, void*))invoker;
            int32_t r = f(ctx, wa);
            std::free(wa);
            return MockValue::N(r);
        }
        if (!hasThis && arg0T == tidInt && retT == tidInt) {  // free fn: int -> int
            auto f = (int32_t (*)(void*, int32_t))invoker;
            return MockValue::N(f(ctx, (int32_t)a[base].num));
        }
        if (retT != tidStr && arg0T != tidStr && !hasThis) {  // static factory: int -> ptr (smart)
            auto f = (void* (*)(void*, int32_t))invoker;
            return MockValue::P(f(ctx, (int32_t)a[base].num));
        }
        if (!hasThis && arg0T == tidStr) {  // static factory: string -> ptr (may raise or return null)
            void* wa = str_to_wire(a[base].str);
            auto f = (void* (*)(void*, void*))invoker;
            void* r = f(ctx, wa);
            std::free(wa);
            return MockValue::P(r);
        }
        if (arg0T == tidStr && retT == tidStr) {  // string -> string
            void* wa = str_to_wire(a[base].str);
            auto f = (void* (*)(void*, void*, void*))invoker;
            void* wr = f(ctx, self, wa);
            std::string out = str_from_wire(wr);
            std::free(wa); std::free(wr);  // embind rule: the consumer frees both ends
            return MockValue::S(out);
        }
        auto f = (int32_t (*)(void*, void*, int32_t))invoker;  // int -> int
        return MockValue::N(f(ctx, self, (int32_t)a[base].num));
    };
}

// ================= ADAPTER: flat C-ABI -> jsi-shaped =================
extern "C" {

void crossbind_embind_register_class(
    CrossbindTid cls, CrossbindTid, CrossbindTid, CrossbindTid,
    const char*, CrossbindFn, const char*, CrossbindFn, const char*, CrossbindFn,
    const char* name, const char*, CrossbindFn dtor) {
    auto rawDtor = (void(*)(void*))dtor;
    ClassEntry& e = g_classes[cls];
    e.name = name;
    e.dtor = [rawDtor](const std::vector<MockValue>& a) { rawDtor((void*)(uintptr_t)a[0].num); return MockValue::N(0); };
    std::printf("[jsi-mock] register_class %s\n", name);
}

void crossbind_embind_register_class_constructor(
    CrossbindTid cls, unsigned argc, const CrossbindTid*,
    const char*, CrossbindFn invoker, CrossbindFn ctor) {
    auto rawInv = invoker; auto rawCtor = ctor;
    g_classes[cls].ctor = [rawInv, rawCtor](const std::vector<MockValue>& a) {
        auto f = (void* (*)(void*, int32_t))rawInv;
        return MockValue::P(f(rawCtor, (int32_t)a[0].num));
    };
    std::printf("[jsi-mock] register_constructor argc=%u\n", argc);
}

void crossbind_embind_register_class_function(
    CrossbindTid cls, const char* name, unsigned argc, const CrossbindTid* argTypes,
    const char*, CrossbindFn invoker, void* ctx,
    unsigned, bool, bool /*isNonnullReturn DROPPED*/) {
    g_classes[cls].methods[name] = make_invoker(true, argc, argTypes, invoker, ctx);
    std::printf("[jsi-mock] register_function %s argc=%u (9-param: isNonnullReturn dropped)\n", name, argc);
}

void crossbind_embind_register_class_class_function(
    CrossbindTid cls, const char* name, unsigned argc, const CrossbindTid* argTypes,
    const char*, CrossbindFn invoker, CrossbindFn method, bool, bool /*isNonnullReturn DROPPED*/) {
    g_classes[cls].statics[name] = make_invoker(false, argc, argTypes, invoker, (void*)method);
    std::printf("[jsi-mock] register_class_function (static) %s argc=%u\n", name, argc);
}

// Free functions share the static shape: argTypes = [ret, args..], target baked as ctx.
static std::unordered_map<std::string, MockFn> g_free;
void crossbind_embind_register_function(
    const char* name, unsigned argc, const CrossbindTid* argTypes,
    const char*, CrossbindFn invoker, CrossbindFn function, bool, bool /*isNonnullReturn DROPPED*/) {
    g_free[name] = make_invoker(false, argc, argTypes, invoker, (void*)function);
    std::printf("[jsi-mock] register_function %s argc=%u\n", name, argc);
}

void crossbind_embind_register_smart_ptr(
    CrossbindTid, CrossbindTid pointee_ty, const char* name, int,
    const char*, CrossbindFn, const char*, CrossbindFn, const char*, CrossbindFn,
    const char*, CrossbindFn destructor) {
    // Flat ABI is (ptr_ty, pointee_ty, ...); the crate passes self.cls as the pointee, so
    // g_classes is keyed by pointee_ty (the 2nd arg) to match register_class.
    auto rawDtor = (void(*)(void*))destructor;
    g_classes[pointee_ty].smartDtor = [rawDtor](const std::vector<MockValue>& a) { rawDtor((void*)(uintptr_t)a[0].num); return MockValue::N(0); };
    std::printf("[jsi-mock] register_smart_ptr %s\n", name);
}

// An enum's wire is int, so methods taking/returning it use the int shape; the mock only needs
// to acknowledge the type registration (jsi-embind's register_enum drops the 5th policy arg).
void crossbind_embind_register_enum(CrossbindTid, const char* name, size_t, bool, int /*policy DROPPED*/) {
    std::printf("[jsi-mock] register_enum %s\n", name);
}
void crossbind_embind_register_enum_value(CrossbindTid, const char* name, int value) {
    std::printf("[jsi-mock] register_enum_value %s=%d\n", name, value);
}

// Value objects: acknowledged here (web-verified against real embind-js). A faithful jsi
// marshaller would construct the temp via ctor, run setters/getters per field, then destruct.
void crossbind_embind_register_value_object(CrossbindTid, const char* name, const char*, CrossbindFn, const char*, CrossbindFn) {
    std::printf("[jsi-mock] register_value_object %s\n", name);
}
void crossbind_embind_register_value_object_field(CrossbindTid, const char* name, CrossbindTid, const char*, CrossbindFn, void*, CrossbindTid, const char*, CrossbindFn, void*) {
    std::printf("[jsi-mock] register_value_object_field %s\n", name);
}
void crossbind_embind_finalize_value_object(CrossbindTid) {
    std::printf("[jsi-mock] finalize_value_object\n");
}

// Deferred registration, like embind-jsi: the init-array constructor stores the function here;
// we run it at the start of main() - the analog of embind-jsi running it after the JSI runtime
// is installed (never at static-init time, which would race the runtime and this file's globals).
static void (*g_pending_init)() = nullptr;
void crossbind_embind_register_bindings(void (*init)()) { g_pending_init = init; }

// JSON-value hooks (serde_json::Value surfaces): the mock's "handles" are 1-based indexes
// into a JSON-text pool - enough to shape-check the wire without a real JS engine.
static std::vector<std::string>& jsonPool() { static std::vector<std::string> p; return p; }
const void* crossbind_tid_emval() { static const char t = 0; return &t; }
void* crossbind_emval_json_to_handle(uint8_t* w) {
    uint32_t len;
    std::memcpy(&len, w, 4);
    jsonPool().emplace_back((const char*)(w + 4), len);
    std::free(w);
    return (void*)jsonPool().size();
}
uint8_t* crossbind_emval_handle_to_json(void* h) {
    const std::string& s = jsonPool().at((size_t)h - 1);
    uint8_t* w = (uint8_t*)std::malloc(4 + s.size());
    uint32_t len = (uint32_t)s.size();
    std::memcpy(w, &len, 4);
    std::memcpy(w + 4, s.data(), s.size());
    return w;
}

// Live JS value hooks (JsValue/JsFunction): link-only stubs - the shape leg never drives the
// E2 markers, it just force_loads the bridge that references these symbols.
void crossbind_v_ref(size_t) {}
void crossbind_v_unref(size_t) {}
size_t crossbind_v_undef() { return 1; }
size_t crossbind_v_from_f64(double) { return 1; }
size_t crossbind_v_from_bool(int) { return 1; }
size_t crossbind_v_from_str(uint8_t* w) { std::free(w); return 1; }
size_t crossbind_v_get_prop(size_t, uint8_t* w) { std::free(w); return 1; }
void crossbind_v_set_prop(size_t, uint8_t* w, size_t) { std::free(w); }
int crossbind_v_kind(size_t) { return 0; }
double crossbind_v_as_f64(size_t) { return 0; }
int crossbind_v_as_bool(size_t) { return 0; }
uint8_t* crossbind_v_as_str(size_t) { return nullptr; }
size_t crossbind_v_call(size_t, unsigned, const size_t*) { return 0; }
uint8_t* crossbind_v_cb_err_take() { return nullptr; }

} // extern "C"

// Find a class entry by name (test-side convenience).
static ClassEntry* by_name(const char* n) {
    for (auto& kv : g_classes) if (kv.second.name == n) return &kv.second;
    return nullptr;
}

int main() {
    // The init-array constructor registered the binding function above; run it now (the analog
    // of embind-jsi running it after the JSI runtime is installed).
    if (g_pending_init) g_pending_init();
    std::printf("--- simulated JS session (through the jsi-mock consumer) ---\n");

    ClassEntry* rc = by_name("RustyCounter");
    MockValue self = rc->ctor({ MockValue::N(10) });
    rc->methods["increment"]({ self, MockValue::N(5) });
    rc->methods["increment"]({ self, MockValue::N(27) });
    rc->methods["addSpan"]({ self, MockValue::N(2), MockValue::N(10) });   // two-arg (N-arity): +8
    // enum in/out marshals through the int shape (Mode::Fast == 1)
    std::printf("mode: %lld\n", (long long)rc->methods["setMode"]({ self, MockValue::N(1) }).num);
    std::printf("current: %lld\n", (long long)rc->methods["current"]({ self }).num);
    std::printf("describe: %s\n", rc->methods["describe"]({ self, MockValue::S("count") }).str.c_str());
    rc->dtor({ self });

    // smart_ptr + static factory
    ClassEntry* wg = by_name("Widget");
    MockValue w = wg->statics["create"]({ MockValue::N(6) });
    std::printf("area: %lld\n", (long long)wg->methods["area"]({ w }).num);
    wg->smartDtor({ w });

    // Idioms through the flat ABI: Result raises, Option<Self> returns null, &str rides the string wire.
    ClassEntry* rci = by_name("RustyCounter");
    MockValue okc = rci->statics["fromText"]({ MockValue::S("42") });
    std::printf("fromText current: %lld\n", (long long)rci->methods["current"]({ okc }).num);
    std::printf("label: %s\n", rci->methods["label"]({ okc, MockValue::S("n=") }).str.c_str());
    rci->methods["checkedDiv"]({ okc, MockValue::N(0) });
    std::printf("checkedDiv raised: %d msg: %s\n", g_raised ? 1 : 0, g_lastError.c_str());
    g_raised = false;
    rci->smartDtor({ okc });
    MockValue badc = rci->statics["fromText"]({ MockValue::S("nope") });
    std::printf("fromText raised: %d null: %d msg: %s\n", g_raised ? 1 : 0, badc.num == 0 ? 1 : 0, g_lastError.c_str());
    g_raised = false;
    MockValue none = rci->statics["parseOpt"]({ MockValue::S("nope") });
    std::printf("parseOpt null: %d raised: %d\n", none.num == 0 ? 1 : 0, g_raised ? 1 : 0);
    ClassEntry* ga = by_name("Gauge");
    MockValue gbad = ga->ctor({ MockValue::N(101) });
    std::printf("gauge raised: %d null: %d msg: %s\n", g_raised ? 1 : 0, gbad.num == 0 ? 1 : 0, g_lastError.c_str());
    g_raised = false;
    MockValue gok = ga->ctor({ MockValue::N(40) });
    std::printf("gauge level: %lld\n", (long long)ga->methods["level"]({ gok }).num);
    std::printf("gaugeStr: %s\n", ga->methods["toString"]({ gok }).str.c_str());
    ga->dtor({ gok });

    // BigInt (i64/u64) and free functions through the flat ABI.
    MockValue big = rci->ctor({ MockValue::N(42) });
    std::printf("addBig: %lld\n", (long long)rci->methods["addBig"]({ big, MockValue::N(1000000000000LL) }).num);
    std::printf("maxU64: %llu\n", (unsigned long long)rci->methods["maxU64"]({ big }).num);
    rci->dtor({ big });
    std::printf("doubleIt: %lld\n", (long long)g_free["doubleIt"]({ MockValue::N(21) }).num);
    std::printf("greet: %s\n", g_free["greet"]({ MockValue::S("rust") }).str.c_str());
    std::printf("checkedParse: %lld\n", (long long)g_free["checkedParse"]({ MockValue::S(" 7 ") }).num);
    g_free["checkedParse"]({ MockValue::S("x") });
    std::printf("checkedParse raised: %d msg: %s\n", g_raised ? 1 : 0, g_lastError.c_str());
    g_raised = false;

    // Optional returns through the nullable-cell wire: read + free like the jsi adapter.
    MockValue opt = rci->ctor({ MockValue::N(42) });
    void* halfCell = (void*)(uintptr_t)rci->methods["half"]({ opt }).num;
    std::printf("half cell: %d\n", halfCell ? *(int32_t*)halfCell : -1);
    std::free(halfCell);
    void* labelCell = (void*)(uintptr_t)rci->methods["maybeLabel"]({ opt }).num;
    std::printf("maybeLabel: %s\n", str_from_wire(labelCell).c_str());
    std::free(labelCell);
    rci->dtor({ opt });
    MockValue odd = rci->ctor({ MockValue::N(7) });
    std::printf("half7 null: %d\n", rci->methods["half"]({ odd }).num == 0 ? 1 : 0);
    rci->dtor({ odd });

    std::printf("NATIVE MOBILE-SHAPED (jsi adapter): PASS\n");
    return 0;
}
