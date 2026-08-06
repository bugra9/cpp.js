// cppjs-embind: host-independent FLAT registration C-ABI (the stable contract).
// The producer (embind-rs) binds only to this; each host adapter maps it to its own world.
#pragma once
#include <cstddef>
#include <cstdint>
extern "C" {
typedef const void* CppjsTid;
typedef void* CppjsFn;   // raw function pointer (a table index on wasm, a real address natively)

void cppjs_embind_register_class(
    CppjsTid cls, CppjsTid ptr_ty, CppjsTid const_ptr_ty, CppjsTid base,
    const char* gat_sig, CppjsFn get_actual_type,
    const char* up_sig, CppjsFn upcast, const char* down_sig, CppjsFn downcast,
    const char* name, const char* dtor_sig, CppjsFn dtor);
void cppjs_embind_register_class_constructor(
    CppjsTid cls, unsigned argc, const CppjsTid* arg_types,
    const char* sig, CppjsFn invoker, CppjsFn ctor);
void cppjs_embind_register_class_function(
    CppjsTid cls, const char* name, unsigned argc, const CppjsTid* arg_types,
    const char* sig, CppjsFn invoker, void* ctx,
    unsigned is_pure_virtual, bool is_async, bool is_nonnull_return);
void cppjs_embind_register_class_class_function(
    CppjsTid cls, const char* name, unsigned argc, const CppjsTid* arg_types,
    const char* sig, CppjsFn invoker, CppjsFn method, bool is_async, bool is_nonnull_return);
void cppjs_embind_register_function(
    const char* name, unsigned argc, const CppjsTid* arg_types,
    const char* sig, CppjsFn invoker, CppjsFn function, bool is_async, bool is_nonnull_return);
// Optional returns. Registration is idempotent per adapter (several bridge archives may ask).
// On wasm the wire is an EM_VAL handle (emval helpers live in the web adapter only); on
// native the jsi adapter converts a nullable heap cell itself.
void cppjs_embind_register_optional(CppjsTid optional_ty, CppjsTid inner_ty);
CppjsTid cppjs_tid_optional_int(void);
CppjsTid cppjs_tid_optional_double(void);
CppjsTid cppjs_tid_optional_bool(void);
CppjsTid cppjs_tid_optional_string(void);
void cppjs_embind_register_smart_ptr(
    CppjsTid ptr_ty, CppjsTid pointee_ty, const char* name, int sharing_policy,
    const char* gp_sig, CppjsFn get_pointee, const char* ctor_sig, CppjsFn constructor,
    const char* share_sig, CppjsFn share, const char* dtor_sig, CppjsFn destructor);
void cppjs_embind_register_enum(
    CppjsTid enum_ty, const char* name, size_t size, bool is_signed, int policy_value);
void cppjs_embind_register_enum_value(CppjsTid enum_ty, const char* value_name, int value);
void cppjs_embind_register_value_object(
    CppjsTid struct_ty, const char* name,
    const char* ctor_sig, CppjsFn ctor, const char* dtor_sig, CppjsFn dtor);
void cppjs_embind_register_value_object_field(
    CppjsTid struct_ty, const char* field_name,
    CppjsTid getter_ret, const char* getter_sig, CppjsFn getter, void* getter_ctx,
    CppjsTid setter_arg, const char* setter_sig, CppjsFn setter, void* setter_ctx);
void cppjs_embind_finalize_value_object(CppjsTid struct_ty);
// Registers a binding-init function; the host runs it when its runtime is ready.
void cppjs_embind_register_bindings(void (*init)());
}
