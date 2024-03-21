/*
 * Copyright 2012 The Emscripten Authors.  All rights reserved.
 * Emscripten is available under two separate licenses, the MIT license and the
 * University of Illinois/NCSA Open Source License.  Both these licenses can be
 * found in the LICENSE file.
 */

#pragma once

#if __cplusplus < 201103L
#error Including <./bind.h> requires building with -std=c++11 or newer!
#endif

#include <cassert>
#include <cstddef>
#include <functional>
#include <map>
#include <string>
#include <type_traits>
#include <vector>

#include "./em_macros.h"
#include "./val.h"
#include "./wire.h"

#if __has_feature(leak_sanitizer) || __has_feature(address_sanitizer)
#include <sanitizer/lsan_interface.h>
#endif

#include "jsi/jsi.h"

// #include <android/log.h>
// #define APPNAME "react-native-cppjs"

namespace emscripten {
    extern facebook::jsi::Runtime* jsRuntime;

    enum class sharing_policy {
        NONE = 0,
        INTRUSIVE = 1,
        BY_EMVAL = 2,
    };

    namespace internal {
        EMSCRIPTEN_KEEPALIVE void _embind_initialize_bindings(facebook::jsi::Runtime& rt);

        typedef long GenericEnumValue;

        typedef void* GenericFunction;
        typedef void (*VoidFunctionPtr)(void);

// Implemented in JavaScript.  Don't call these directly.

        void _embind_fatal_error(
                const char* name,
                const char* payload) __attribute__((__noreturn__));

        void _embind_register_void(
                TYPEID voidType,
                const char* name);

        void _embind_register_bool(
                TYPEID boolType,
                const char* name,
                size_t size,
                bool trueValue,
                bool falseValue);

        void _embind_register_integer(
                TYPEID integerType,
                const char* name,
                size_t size,
                int32_t minRange,
                uint32_t maxRange);

        void _embind_register_bigint(
                TYPEID integerType,
                const char* name,
                size_t size,
                int64_t minRange,
                uint64_t maxRange);

        void _embind_register_float(
                TYPEID floatType,
                const char* name,
                size_t size);

        void _embind_register_std_string(
                TYPEID stringType,
                const char* name);

        void _embind_register_std_wstring(
                TYPEID stringType,
                size_t charSize,
                const char* name);

        void _embind_register_emval(
                TYPEID emvalType,
                const char* name);

        void _embind_register_memory_view(
                TYPEID memoryViewType,
                unsigned typedArrayIndex,
                const char* name);

        void _embind_register_function(
                const char* name,
                unsigned argCount,
                const TYPEID argTypes[],
                const char* signature,
                facebook::jsi::Function& invoker,
                GenericFunction function,
                bool isAsync);

        void _embind_register_value_array(
                TYPEID tupleType,
                const char* name,
                const char* constructorSignature,
                facebook::jsi::Function& constructor,
                const char* destructorSignature,
                facebook::jsi::Function& destructor);

        void _embind_register_value_array_element(
                TYPEID tupleType,
                TYPEID getterReturnType,
                const char* getterSignature,
                facebook::jsi::Function& getter,
                void* getterContext,
                TYPEID setterArgumentType,
                const char* setterSignature,
                facebook::jsi::Function& setter,
                void* setterContext);

        void _embind_finalize_value_array(TYPEID tupleType);

        void _embind_register_value_object(
                TYPEID structType,
                const char* fieldName,
                const char* constructorSignature,
                facebook::jsi::Function& constructor,
                const char* destructorSignature,
                facebook::jsi::Function& destructor);

        void _embind_register_value_object_field(
                TYPEID structType,
                const char* fieldName,
                TYPEID getterReturnType,
                const char* getterSignature,
                facebook::jsi::Function& getter,
                void* getterContext,
                TYPEID setterArgumentType,
                const char* setterSignature,
                facebook::jsi::Function& setter,
                void* setterContext);

        void _embind_finalize_value_object(TYPEID structType);

        void _embind_register_class(
                TYPEID classType,
                TYPEID pointerType,
                TYPEID constPointerType,
                TYPEID baseClassType,
                const char* getActualTypeSignature,
                facebook::jsi::Function& getActualType,
                const char* upcastSignature,
                facebook::jsi::Function& upcast,
                const char* downcastSignature,
                facebook::jsi::Function& downcast,
                const char* className,
                const char* destructorSignature,
                facebook::jsi::Function& destructor);

        void _embind_register_class_constructor(
                TYPEID classType,
                unsigned argCount,
                const TYPEID argTypes[],
                const char* invokerSignature,
                facebook::jsi::Function& invoker,
                GenericFunction constructor);

        void _embind_register_class_function(
                TYPEID classType,
                const char* methodName,
                unsigned argCount,
                const TYPEID argTypes[],
                const char* invokerSignature,
                facebook::jsi::Function& invoker,
                void* context,
                unsigned isPureVirtual,
                bool isAsync);

        void _embind_register_class_property(
                TYPEID classType,
                const char* fieldName,
                TYPEID getterReturnType,
                const char* getterSignature,
                facebook::jsi::Function& getter,
                void* getterContext,
                TYPEID setterArgumentType,
                const char* setterSignature,
                facebook::jsi::Function& setter,
                void* setterContext);

        void _embind_register_class_class_function(
                TYPEID classType,
                const char* methodName,
                unsigned argCount,
                const TYPEID argTypes[],
                const char* invokerSignature,
                facebook::jsi::Function& invoker,
                GenericFunction method,
                bool isAsync);

        void _embind_register_class_class_property(
                TYPEID classType,
                const char* fieldName,
                TYPEID fieldType,
                void* fieldContext,
                const char* getterSignature,
                facebook::jsi::Function& getter,
                const char* setterSignature,
                facebook::jsi::Function& setter);

        EM_VAL _embind_create_inheriting_constructor(
                const char* constructorName,
                TYPEID wrapperType,
                EM_VAL properties);

        void _embind_register_enum(
                TYPEID enumType,
                const char* name,
                size_t size,
                bool isSigned);

        void _embind_register_smart_ptr(
                TYPEID pointerType,
                TYPEID pointeeType,
                const char* pointerName,
                sharing_policy sharingPolicy,
                const char* getPointeeSignature,
                facebook::jsi::Function& getPointee,
                const char* constructorSignature,
                facebook::jsi::Function& constructor,
                const char* shareSignature,
                facebook::jsi::Function& share,
                const char* destructorSignature,
                facebook::jsi::Function& destructor);

        void _embind_register_enum_value(
                TYPEID enumType,
                const char* valueName,
                GenericEnumValue value);

        void _embind_register_constant(
                const char* name,
                TYPEID constantType,
                const facebook::jsi::Value value);

// Register an InitFunc in the global linked list of init functions.
        void _embind_register_bindings(struct InitFunc* f);

// Binding initialization functions registerd by EMSCRIPTEN_BINDINGS macro
// below.  Stored as linked list of static data object avoiding std containers
// to avoid static contructor ordering issues.
        struct InitFunc {
            InitFunc(void (*init_func)()) : init_func(init_func) {
                // This the function immediately upon constructions, and also register
                // it so that it can be called again on each worker that starts.
                // init_func();
                _embind_register_bindings(this);
            }
            void (*init_func)();
            InitFunc* next = nullptr;
        };


    } // end namespace internal

////////////////////////////////////////////////////////////////////////////////
// POLICIES
////////////////////////////////////////////////////////////////////////////////

    template<int Index>
    struct arg {
        static constexpr int index = Index + 1;
    };

    struct ret_val {
        static constexpr int index = 0;
    };

/*
template<typename Slot>
struct allow_raw_pointer {
    template<typename InputType, int Index>
    struct Transform {
        typedef typename std::conditional<
            Index == Slot::index,
            internal::AllowedRawPointer<typename std::remove_pointer<InputType>::type>,
            InputType
        >::type type;
    };
};
*/

// allow all raw pointers
    struct allow_raw_pointers {
        template<typename InputType, int Index>
        struct Transform {
            typedef typename std::conditional<
                    std::is_pointer<InputType>::value,
                    internal::AllowedRawPointer<typename std::remove_pointer<InputType>::type>,
                    InputType
            >::type type;
        };
    };

// this is temporary until arg policies are reworked
    template<typename Slot>
    struct allow_raw_pointer : public allow_raw_pointers {
    };

    struct async {
        template<typename InputType, int Index>
        struct Transform {
            typedef InputType type;
        };
    };

    namespace internal {

        template<typename... Policies>
        struct isAsync;

        template<typename... Rest>
        struct isAsync<async, Rest...> {
            static constexpr bool value = true;
        };

        template<typename T, typename... Rest>
        struct isAsync<T, Rest...> {
            static constexpr bool value = isAsync<Rest...>::value;
        };

        template<>
        struct isAsync<> {
            static constexpr bool value = false;
        };

    }

////////////////////////////////////////////////////////////////////////////////
// select_overload and select_const
////////////////////////////////////////////////////////////////////////////////

    template<typename Signature>
    Signature* select_overload(Signature* fn) {
        return fn;
    }

    template<typename Signature, typename ClassType>
    auto select_overload(Signature (ClassType::*fn)) -> decltype(fn) {
            return fn;
    }

    template<typename ClassType, typename ReturnType, typename... Args>
    auto select_const(ReturnType (ClassType::*method)(Args...) const) -> decltype(method) {
            return method;
    }

    namespace internal {
// this should be in <type_traits>, but alas, it's not
        template<typename T> struct remove_class;
        template<typename C, typename R, typename... A>
        struct remove_class<R(C::*)(A...)> { using type = R(A...); };
        template<typename C, typename R, typename... A>
        struct remove_class<R(C::*)(A...) const> { using type = R(A...); };
        template<typename C, typename R, typename... A>
        struct remove_class<R(C::*)(A...) volatile> { using type = R(A...); };
        template<typename C, typename R, typename... A>
        struct remove_class<R(C::*)(A...) const volatile> { using type = R(A...); };

        template<typename LambdaType>
        using LambdaSignature = typename remove_class<
                decltype(&LambdaType::operator())
        >::type;
    } // end namespace internal

// requires captureless lambda because implicitly coerces to function pointer
    template<typename LambdaType>
    internal::LambdaSignature<LambdaType>* optional_override(const LambdaType& fp) {
        return fp;
    }

////////////////////////////////////////////////////////////////////////////////
// Invoker
////////////////////////////////////////////////////////////////////////////////

    namespace internal {

        template<typename ReturnType, typename... Args>
        struct Invoker {
            static typename internal::BindingType<ReturnType>::WireType invoke(
                    ReturnType (*fn)(Args...),
                    typename internal::BindingType<Args>::WireType... args
            ) {
                return internal::BindingType<ReturnType>::toWireType(
                        fn(
                                internal::BindingType<Args>::fromWireType(args)...
                        )
                );
            }

            static typename internal::BindingType<ReturnType>::WireType2 invoke2(
                    facebook::jsi::Runtime& rt,
                    ReturnType (*fn)(Args...),
                    typename internal::BindingType<Args>::WireType2&... args
            ) {
                return internal::BindingType<ReturnType>::toWireType2(rt,
                                                                      fn(
                                                                              internal::BindingType<Args>::fromWireType2(rt, args)...
                                                                      )
                );
            }
        };

        template<typename... Args>
        struct Invoker<void, Args...> {
            static void invoke(
                    void (*fn)(Args...),
                    typename internal::BindingType<Args>::WireType... args
            ) {
                return fn(
                        internal::BindingType<Args>::fromWireType(args)...
                );
            }

            static void invoke2(
                    facebook::jsi::Runtime& rt,
                    void (*fn)(Args...),
                    typename internal::BindingType<Args>::WireType2&... args
            ) {
                return fn(
                        internal::BindingType<Args>::fromWireType2(rt, args)...
                );
            }
        };

        namespace async {

            template<typename F, F f> struct Wrapper;
            template<typename ReturnType, typename... Args, ReturnType(*f)(Args...)>
            struct Wrapper<ReturnType(*)(Args...), f> {
                EMSCRIPTEN_KEEPALIVE static ReturnType invoke(Args... args) {
                    return f(args...);
                }
            };

        } // end namespace async

        template<typename T, typename... Policies>
        using maybe_wrap_async = typename std::conditional<
                isAsync<Policies...>::value,
                async::Wrapper<decltype(&T::invoke2), &T::invoke2>,
                T
        >::type;

        template<typename FunctorType, typename ReturnType, typename... Args>
        struct FunctorInvoker {
            static typename internal::BindingType<ReturnType>::WireType invoke(
                    FunctorType& function,
                    typename internal::BindingType<Args>::WireType... args
            ) {
                return internal::BindingType<ReturnType>::toWireType(
                        function(
                                internal::BindingType<Args>::fromWireType(args)...)
                );
            }

            static typename internal::BindingType<ReturnType>::WireType2 invoke2(
                    facebook::jsi::Runtime& rt,
                    FunctorType& function,
                    typename internal::BindingType<Args>::WireType2&... args
            ) {
                return internal::BindingType<ReturnType>::toWireType2(
                        rt,
                        function(
                                internal::BindingType<Args>::fromWireType2(rt, args)...)
                );
            }
        };

        template<typename FunctorType, typename... Args>
        struct FunctorInvoker<FunctorType, void, Args...> {
            static void invoke(
                    FunctorType& function,
                    typename internal::BindingType<Args>::WireType... args
            ) {
                function(
                        internal::BindingType<Args>::fromWireType(args)...);
            }

            static void invoke2(
                    facebook::jsi::Runtime& rt,
                    FunctorType& function,
                    typename internal::BindingType<Args>::WireType2&... args
            ) {
                function(
                        internal::BindingType<Args>::fromWireType2(rt, args)...);
            }
        };

    } // end namespace internal

////////////////////////////////////////////////////////////////////////////////
// SignatureCode, SignatureString
////////////////////////////////////////////////////////////////////////////////

    namespace internal {

        template<typename T>
        struct SignatureCode {};

        template<>
        struct SignatureCode<int> {
            static constexpr char get() {
                return 'i';
            }
        };

        template<>
        struct SignatureCode<void> {
            static constexpr char get() {
                return 'v';
            }
        };

        template<>
        struct SignatureCode<float> {
            static constexpr char get() {
                return 'f';
            }
        };

        template<>
        struct SignatureCode<double> {
            static constexpr char get() {
                return 'd';
            }
        };

#ifdef __wasm64__
        // With wasm32 we can fallback to 'i' for pointer types but we need special
// handling with wasm64.
template<>
struct SignatureCode<void*> {
    static constexpr char get() {
        return 'p';
    }
};
template<>
struct SignatureCode<size_t> {
    static constexpr char get() {
        return 'p';
    }
};
#endif

        template<typename... Args>
        const char* getGenericSignature() {
            static constexpr char signature[] = { SignatureCode<Args>::get()..., 0 };
            return signature;
        }

        template<typename T> struct SignatureTranslator { using type = int; };
        template<> struct SignatureTranslator<void> { using type = void; };
        template<> struct SignatureTranslator<float> { using type = float; };
        template<> struct SignatureTranslator<double> { using type = double; };
#ifdef __wasm64__
        template<> struct SignatureTranslator<size_t> { using type = size_t; };
template<typename PtrType>
struct SignatureTranslator<PtrType*> { using type = void*; };
template<typename PtrType>
struct SignatureTranslator<PtrType&> { using type = void*; };
template<typename ReturnType, typename... Args>
struct SignatureTranslator<ReturnType (*)(Args...)> { using type = void*; };
#endif

        template<typename... Args>
        EMSCRIPTEN_ALWAYS_INLINE const char* getSpecificSignature() {
            return getGenericSignature<typename SignatureTranslator<Args>::type...>();
        }

        template<typename Return, typename... Args>
        EMSCRIPTEN_ALWAYS_INLINE const char* getSignature(Return (*)(Args...)) {
            return getSpecificSignature<Return, Args...>();
        }

    } // end namespace internal

////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS
////////////////////////////////////////////////////////////////////////////////

#define call_invoke_4 ({return invoke(fn, args[0], args[1], args[2], args[3]);})
#define call_invoke(count) (call_invoke_##count)

#define callInvoke(count, invokeVar, fnVar) ({ \
    if constexpr (count == 1) { return invokeVar(rt, fnVar, args[0]); }\
    else if constexpr (count == 2) { return invokeVar(rt, fnVar, args[0], args[1]); }\
    else if constexpr (count == 3) { return invokeVar(rt, fnVar, args[0], args[1], args[2]); }\
    else if constexpr (count == 4) { return invokeVar(rt, fnVar, args[0], args[1], args[2], args[3]); }\
    else if constexpr (count == 5) { return invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4]); }\
    else if constexpr (count == 6) { return invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5]); }\
    else if constexpr (count == 7) { return invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6]); }\
    else if constexpr (count == 8) { return invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]); }\
    else if constexpr (count == 9) { return invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]); }\
    else if constexpr (count == 10) { return invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]); }\
    else if constexpr (count == 11) { return invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]); }\
    else if constexpr (count == 12) { return invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11]); }\
    else if constexpr (count == 13) { return invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12]); }\
    else if constexpr (count == 14) { return invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13]); }\
    else if constexpr (count == 15) { return invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14]); }\
    else { return invokeVar(rt, fnVar); }                                              \
})

#define callInvokeVoid(count, invokeVar, fnVar) ({ \
    if constexpr (count == 1) { invokeVar(rt, fnVar, args[0]); }\
    else if constexpr (count == 2) { invokeVar(rt, fnVar, args[0], args[1]); }\
    else if constexpr (count == 3) { invokeVar(rt, fnVar, args[0], args[1], args[2]); }\
    else if constexpr (count == 4) { invokeVar(rt, fnVar, args[0], args[1], args[2], args[3]); }\
    else if constexpr (count == 5) { invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4]); }\
    else if constexpr (count == 6) { invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5]); }\
    else if constexpr (count == 7) { invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6]); }\
    else if constexpr (count == 8) { invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]); }\
    else if constexpr (count == 9) { invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8]); }\
    else if constexpr (count == 10) { invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]); }\
    else if constexpr (count == 11) { invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10]); }\
    else if constexpr (count == 12) { invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11]); }\
    else if constexpr (count == 13) { invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12]); }\
    else if constexpr (count == 14) { invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13]); }\
    else if constexpr (count == 15) { invokeVar(rt, fnVar, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14]); }\
    else { invokeVar(rt, fnVar); }                                              \
})

    template<typename ReturnType, typename... Args, typename... Policies>
    void function(const char* name, ReturnType (*fn)(Args...), Policies...) {
        using namespace internal;
        typename WithPolicies<Policies...>::template ArgTypeList<ReturnType, Args...> args;
        using OriginalInvoker = Invoker<ReturnType, Args...>;
        auto invoke = &maybe_wrap_async<OriginalInvoker, Policies...>::invoke2;
        facebook::jsi::Function invokeJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_"+getSignature(invoke)),
                args.getCount(),
                [invoke, fn](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    if constexpr (std::is_same<ReturnType, void>::value) {
                    callInvokeVoid(sizeof...(Args), invoke, fn);
                    return nullptr;
                } else {
                    callInvoke(sizeof...(Args), invoke, fn);
                }
                });
        _embind_register_function(
                name,
                args.getCount(),
                args.getTypes(),
                getSignature(invoke),
                invokeJSIFunc,
                reinterpret_cast<GenericFunction>(fn),
                isAsync<Policies...>::value);
    }

    namespace internal {

        template<typename ClassType, typename... Args>
        ClassType* operator_new(Args&&... args) {
            return new ClassType(std::forward<Args>(args)...);
        }

        template<typename WrapperType, typename ClassType, typename... Args>
        WrapperType wrapped_new(Args&&... args) {
            return WrapperType(new ClassType(std::forward<Args>(args)...));
        }

        template<typename ClassType, typename... Args>
        ClassType* raw_constructor(
                typename internal::BindingType<Args>::WireType2&... args
        ) {
            return new ClassType(
                    internal::BindingType<Args>::fromWireType2(*jsRuntime, args)...
            );
        }

        template<typename ClassType>
        void raw_destructor(ClassType* ptr) {
            delete ptr;
        }

        template<typename FunctionPointerType, typename ReturnType, typename ThisType, typename... Args>
        struct FunctionInvoker {
            static typename internal::BindingType<ReturnType>::WireType invoke(
                    FunctionPointerType* function,
                    typename internal::BindingType<ThisType>::WireType wireThis,
                    typename internal::BindingType<Args>::WireType... args
            ) {
                return internal::BindingType<ReturnType>::toWireType(
                        (*function)(
                                internal::BindingType<ThisType>::fromWireType(wireThis),
                                internal::BindingType<Args>::fromWireType(args)...)
                );
            }

            static typename internal::BindingType<ReturnType>::WireType2 invoke2(
                    facebook::jsi::Runtime& rt,
                    FunctionPointerType* function,
                    typename internal::BindingType<ThisType>::WireType2& wireThis,
                    typename internal::BindingType<Args>::WireType2&... args
            ) {
                return internal::BindingType<ReturnType>::toWireType2(
                        rt,
                        (*function)(
                                internal::BindingType<ThisType>::fromWireType2(rt, wireThis),
                                internal::BindingType<Args>::fromWireType2(rt, args)...)
                );
            }
        };

        template<typename FunctionPointerType, typename ThisType, typename... Args>
        struct FunctionInvoker<FunctionPointerType, void, ThisType, Args...> {
            static void invoke(
                    FunctionPointerType* function,
                    typename internal::BindingType<ThisType>::WireType wireThis,
                    typename internal::BindingType<Args>::WireType... args
            ) {
                (*function)(
                        internal::BindingType<ThisType>::fromWireType(wireThis),
                        internal::BindingType<Args>::fromWireType(args)...);
            }

            static void invoke2(
                    facebook::jsi::Runtime& rt,
                    FunctionPointerType* function,
                    typename internal::BindingType<ThisType>::WireType2& wireThis,
                    typename internal::BindingType<Args>::WireType2&... args
            ) {
                (*function)(
                        internal::BindingType<ThisType>::fromWireType2(rt, wireThis),
                        internal::BindingType<Args>::fromWireType2(rt, args)...);
            }
        };

        template<typename MemberPointer,
                typename ReturnType,
                typename ThisType,
                typename... Args>
        struct MethodInvoker {
            static typename internal::BindingType<ReturnType>::WireType invoke(
                    const MemberPointer& method,
                    typename internal::BindingType<ThisType>::WireType wireThis,
                    typename internal::BindingType<Args>::WireType... args
            ) {
                return internal::BindingType<ReturnType>::toWireType(
                        (internal::BindingType<ThisType>::fromWireType(wireThis)->*method)(
                                internal::BindingType<Args>::fromWireType(args)...
                        )
                );
            }

            static typename internal::BindingType<ReturnType>::WireType2 invoke2(
                    facebook::jsi::Runtime& rt,
                    const MemberPointer& method,
                    typename internal::BindingType<ThisType>::WireType2& wireThis,
                    typename internal::BindingType<Args>::WireType2&... args
            ) {
                return internal::BindingType<ReturnType>::toWireType2(rt,
                                                                      (internal::BindingType<ThisType>::fromWireType2(rt, wireThis)->*method)(
                                                                              internal::BindingType<Args>::fromWireType2(rt, args)...
                                                                      )
                );
            }
        };

        template<typename MemberPointer,
                typename ThisType,
                typename... Args>
        struct MethodInvoker<MemberPointer, void, ThisType, Args...> {
            static void invoke(
                    const MemberPointer& method,
                    typename internal::BindingType<ThisType>::WireType wireThis,
                    typename internal::BindingType<Args>::WireType... args
            ) {
                return (internal::BindingType<ThisType>::fromWireType(wireThis)->*method)(
                        internal::BindingType<Args>::fromWireType(args)...
                );
            }

            static void invoke2(
                    facebook::jsi::Runtime& rt,
                    const MemberPointer& method,
                    typename internal::BindingType<ThisType>::WireType2& wireThis,
                    typename internal::BindingType<Args>::WireType2&... args
            ) {
                return (internal::BindingType<ThisType>::fromWireType2(rt, wireThis)->*method)(
                        internal::BindingType<Args>::fromWireType2(rt, args)...
                );
            }
        };

        template<typename InstanceType, typename MemberType>
        struct MemberAccess {
            typedef MemberType InstanceType::*MemberPointer;
            typedef internal::BindingType<MemberType> MemberBinding;
            typedef typename MemberBinding::WireType WireType;
            typedef typename MemberBinding::WireType2 WireType2;

            template<typename ClassType>
            static WireType getWire(
                    const MemberPointer& field,
                    const ClassType& ptr
            ) {
                return MemberBinding::toWireType(ptr.*field);
            }

            template<typename ClassType>
            static void setWire(
                    const MemberPointer& field,
                    ClassType& ptr,
                    WireType value
            ) {
                ptr.*field = MemberBinding::fromWireType(value);
            }

            template<typename ClassType>
            static WireType2 getWire2(
                    const MemberPointer& field,
                    const ClassType& ptr
            ) {
                return MemberBinding::toWireType2(*jsRuntime, ptr.*field);
            }

            template<typename ClassType>
            static void setWire2(
                    const MemberPointer& field,
                    ClassType& ptr,
                    WireType2& value
            ) {
                ptr.*field = MemberBinding::fromWireType2(*jsRuntime, value);
            }
        };

        template<typename FieldType>
        struct GlobalAccess {
            typedef internal::BindingType<FieldType> MemberBinding;
            typedef typename MemberBinding::WireType WireType;
            typedef typename MemberBinding::WireType2 WireType2;

            static WireType get(FieldType* context) {
                return MemberBinding::toWireType(*context);
            }

            static void set(FieldType* context, WireType value) {
                *context = MemberBinding::fromWireType(value);
            }

            static WireType2 get2(FieldType* context) {
                return MemberBinding::toWireType2(*jsRuntime, *context);
            }

            static void set2(FieldType* context, WireType2& value) {
                *context = MemberBinding::fromWireType2(*jsRuntime, value);
            }
        };

// TODO: This could do a reinterpret-cast if sizeof(T) === sizeof(void*)
        template<typename T>
        inline T* getContext(const T& t) {
            // not a leak because this is called once per binding
            auto* ret = new T(t);
#if __has_feature(leak_sanitizer) || __has_feature(address_sanitizer)
            __lsan_ignore_object(ret);
#endif
            return ret;
        }

        template<typename Accessor, typename ValueType>
        struct PropertyTag {};

        template<typename T>
        struct GetterPolicy;

        template<typename GetterReturnType, typename GetterThisType>
        struct GetterPolicy<GetterReturnType (GetterThisType::*)() const> {
            typedef GetterReturnType ReturnType;
            typedef GetterReturnType (GetterThisType::*Context)() const;

            typedef internal::BindingType<ReturnType> Binding;
            typedef typename Binding::WireType WireType;
            typedef typename Binding::WireType2 WireType2;

            template<typename ClassType>
            static WireType get(const Context& context, const ClassType& ptr) {
                return Binding::toWireType((ptr.*context)());
            }

            template<typename ClassType>
            static WireType2 get2(const Context& context, const ClassType& ptr) {
                return Binding::toWireType2(*jsRuntime, (ptr.*context)());
            }

            static void* getContext(Context context) {
                return internal::getContext(context);
            }
        };

#ifdef __cpp_noexcept_function_type
        template<typename GetterReturnType, typename GetterThisType>
struct GetterPolicy<GetterReturnType (GetterThisType::*)() const noexcept>
     : GetterPolicy<GetterReturnType (GetterThisType::*)() const> {};
#endif

        template<typename GetterReturnType, typename GetterThisType>
        struct GetterPolicy<GetterReturnType (*)(const GetterThisType&)> {
            typedef GetterReturnType ReturnType;
            typedef GetterReturnType (*Context)(const GetterThisType&);

            typedef internal::BindingType<ReturnType> Binding;
            typedef typename Binding::WireType WireType;
            typedef typename Binding::WireType2 WireType2;

            template<typename ClassType>
            static WireType get(const Context& context, const ClassType& ptr) {
                return Binding::toWireType(context(ptr));
            }

            template<typename ClassType>
            static WireType2 get2(const Context& context, const ClassType& ptr) {
                return Binding::toWireType2(*jsRuntime, context(ptr));
            }

            static void* getContext(Context context) {
                return internal::getContext(context);
            }
        };

        template<typename GetterReturnType, typename GetterThisType>
        struct GetterPolicy<std::function<GetterReturnType(const GetterThisType&)>> {
        typedef GetterReturnType ReturnType;
        typedef std::function<GetterReturnType(const GetterThisType&)> Context;

        typedef internal::BindingType<ReturnType> Binding;
        typedef typename Binding::WireType WireType;
        typedef typename Binding::WireType2 WireType2;

        template<typename ClassType>
        static WireType get(const Context& context, const ClassType& ptr) {
            return Binding::toWireType(context(ptr));
        }

        template<typename ClassType>
        static WireType2 get2(const Context& context, const ClassType& ptr) {
            return Binding::toWireType2(*jsRuntime, context(ptr));
        }

        static void* getContext(const Context& context) {
            return internal::getContext(context);
        }
    };

    template<typename Getter, typename GetterReturnType>
    struct GetterPolicy<PropertyTag<Getter, GetterReturnType>> {
    typedef GetterReturnType ReturnType;
    typedef Getter Context;

    typedef internal::BindingType<ReturnType> Binding;
    typedef typename Binding::WireType WireType;
    typedef typename Binding::WireType2 WireType2;

    template<typename ClassType>
    static WireType get(const Context& context, const ClassType& ptr) {
        return Binding::toWireType(context(ptr));
    }

    template<typename ClassType>
    static WireType2 get2(const Context& context, const ClassType& ptr) {
        return Binding::toWireType2(*jsRuntime, context(ptr));
    }

    static void* getContext(const Context& context) {
        return internal::getContext(context);
    }
};

template<typename T>
struct SetterPolicy;

template<typename SetterReturnType, typename SetterThisType, typename SetterArgumentType>
struct SetterPolicy<SetterReturnType (SetterThisType::*)(SetterArgumentType)> {
    typedef SetterArgumentType ArgumentType;
    typedef SetterReturnType (SetterThisType::*Context)(SetterArgumentType);

    typedef internal::BindingType<SetterArgumentType> Binding;
    typedef typename Binding::WireType WireType;
    typedef typename Binding::WireType2 WireType2;

    template<typename ClassType>
    static void set(const Context& context, ClassType& ptr, WireType wt) {
        (ptr.*context)(Binding::fromWireType(wt));
    }

    template<typename ClassType>
    static void set2(const Context& context, ClassType& ptr, WireType2& wt) {
        (ptr.*context)(Binding::fromWireType2(*jsRuntime, wt));
    }

    static void* getContext(Context context) {
        return internal::getContext(context);
    }
};

#ifdef __cpp_noexcept_function_type
template<typename SetterReturnType, typename SetterThisType, typename SetterArgumentType>
struct SetterPolicy<SetterReturnType (SetterThisType::*)(SetterArgumentType) noexcept>
     : SetterPolicy<SetterReturnType (SetterThisType::*)(SetterArgumentType)> {};
#endif

template<typename SetterReturnType, typename SetterThisType, typename SetterArgumentType>
struct SetterPolicy<SetterReturnType (*)(SetterThisType&, SetterArgumentType)> {
    typedef SetterArgumentType ArgumentType;
    typedef SetterReturnType (*Context)(SetterThisType&, SetterArgumentType);

    typedef internal::BindingType<SetterArgumentType> Binding;
    typedef typename Binding::WireType WireType;
    typedef typename Binding::WireType2 WireType2;

    template<typename ClassType>
    static void set(const Context& context, ClassType& ptr, WireType wt) {
        context(ptr, Binding::fromWireType(wt));
    }

    template<typename ClassType>
    static void set2(const Context& context, ClassType& ptr, WireType2& wt) {
        context(ptr, Binding::fromWireType2(*jsRuntime, wt));
    }

    static void* getContext(Context context) {
        return internal::getContext(context);
    }
};

template<typename SetterReturnType, typename SetterThisType, typename SetterArgumentType>
struct SetterPolicy<std::function<SetterReturnType(SetterThisType&, SetterArgumentType)>> {
typedef SetterArgumentType ArgumentType;
typedef std::function<SetterReturnType(SetterThisType&, SetterArgumentType)> Context;

typedef internal::BindingType<SetterArgumentType> Binding;
typedef typename Binding::WireType WireType;
typedef typename Binding::WireType2 WireType2;

template<typename ClassType>
static void set(const Context& context, ClassType& ptr, WireType wt) {
    context(ptr, Binding::fromWireType(wt));
}

template<typename ClassType>
static void set2(const Context& context, ClassType& ptr, WireType2& wt) {
    context(ptr, Binding::fromWireType2(*jsRuntime, wt));
}

static void* getContext(const Context& context) {
    return internal::getContext(context);
}
};

template<typename Setter, typename SetterArgumentType>
struct SetterPolicy<PropertyTag<Setter, SetterArgumentType>> {
typedef SetterArgumentType ArgumentType;
typedef Setter Context;

typedef internal::BindingType<SetterArgumentType> Binding;
typedef typename Binding::WireType WireType;
typedef typename Binding::WireType2 WireType2;

template<typename ClassType>
static void set(const Context& context, ClassType& ptr, WireType wt) {
    context(ptr, Binding::fromWireType(wt));
}

template<typename ClassType>
static void set2(const Context& context, ClassType& ptr, WireType2& wt) {
    context(ptr, Binding::fromWireType2(*jsRuntime, wt));
}

static void* getContext(const Context& context) {
    return internal::getContext(context);
}
};

class noncopyable {
protected:
    noncopyable() {}
    ~noncopyable() {}
private:
    noncopyable(const noncopyable&) = delete;
    const noncopyable& operator=(const noncopyable&) = delete;
};

template<typename ClassType, typename ElementType>
typename BindingType<ElementType>::WireType2 get_by_index(int index, ClassType& ptr) {
    return BindingType<ElementType>::toWireType2(*jsRuntime, ptr[index]);
}

template<typename ClassType, typename ElementType>
void set_by_index(int index, ClassType& ptr, typename BindingType<ElementType>::WireType2& wt) {
    ptr[index] = BindingType<ElementType>::fromWireType2(*jsRuntime, wt);
}

} // end namespace internal

template<int Index>
struct index {
};

////////////////////////////////////////////////////////////////////////////////
// VALUE TUPLES
////////////////////////////////////////////////////////////////////////////////

template<typename ClassType>
class value_array : public internal::noncopyable {
public:
    typedef ClassType class_type;

    value_array(const char* name) {
        using namespace internal;

        auto constructor = &raw_constructor<ClassType>;
        auto destructor = &raw_destructor<ClassType>;

        facebook::jsi::Function constructorJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_constructor"),
                0,
                [constructor](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    ClassType* t = constructor();
                    return facebook::jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(t));
                });

        facebook::jsi::Function destructorJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_constructor"),
                1,
                [destructor](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    ClassType* t = reinterpret_cast<ClassType*>(args[0].asBigInt(rt).asUint64(rt));
                    destructor(t);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_value_array(
                TypeID<ClassType>::get(),
                name,
                getSignature(constructor),
                constructorJSIFunc,
                getSignature(destructor),
                destructorJSIFunc);
    }

    ~value_array() {
        using namespace internal;
        _embind_finalize_value_array(TypeID<ClassType>::get());
    }

    template<typename InstanceType, typename ElementType>
    value_array& element(ElementType InstanceType::*field) {
        using namespace internal;

        auto getter = &MemberAccess<InstanceType, ElementType>
        ::template getWire2<ClassType>;
        auto setter = &MemberAccess<InstanceType, ElementType>
        ::template setWire2<ClassType>;

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_array_element_gter1"),
                2,
                [getter, field](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    return getter(field, *t2);
                });

        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_array_element_ster1"),
                3,
                [setter, field](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    setter(field, *t2, args[2]);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_value_array_element(
                TypeID<ClassType>::get(),
                TypeID<ElementType>::get(),
                getSignature(getter),
                getterJSIFunc,
                getContext(field),
                TypeID<ElementType>::get(),
                getSignature(setter),
                setterJSIFunc,
                getContext(field));
        return *this;
    }

    template<typename Getter, typename Setter>
    value_array& element(Getter getter, Setter setter) {
        using namespace internal;
        typedef GetterPolicy<Getter> GP;
        typedef SetterPolicy<Setter> SP;

        auto g = &GP::template get2<ClassType>;
        auto s = &SP::template set2<ClassType>;

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_array_element_gter2"),
                2,
                [g, getter](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    Getter* t = reinterpret_cast<Getter*>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    return g(getter, *t2);
                });

        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_array_element_ster2"),
                3,
                [s](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    Setter* t = reinterpret_cast<Setter*>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    s(*t, *t2, args[2]);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_value_array_element(
                TypeID<ClassType>::get(),
                TypeID<typename GP::ReturnType>::get(),
                getSignature(g),
                getterJSIFunc,
                GP::getContext(getter),
                TypeID<typename SP::ArgumentType>::get(),
                getSignature(s),
                setterJSIFunc,
                SP::getContext(setter));
        return *this;
    }

    template<int Index>
    value_array& element(index<Index>) {
        using namespace internal;
        ClassType* null = 0;
        typedef typename std::remove_reference<decltype((*null)[Index])>::type ElementType;
        auto getter = &internal::get_by_index<ClassType, ElementType>;
        auto setter = &internal::set_by_index<ClassType, ElementType>;

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_array_element_gter3"),
                2,
                [getter](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    int t1 = static_cast<int>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    return getter(t1, *t2);
                });


        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_array_element_ster3"),
                3,
                [setter](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    int t1 = static_cast<int>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    setter(t1, *t2, args[2]);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_value_array_element(
                TypeID<ClassType>::get(),
                TypeID<ElementType>::get(),
                getSignature(getter),
                getterJSIFunc,
                reinterpret_cast<void*>(Index),
                TypeID<ElementType>::get(),
                getSignature(setter),
                setterJSIFunc,
                reinterpret_cast<void*>(Index));
        return *this;
    }
};

////////////////////////////////////////////////////////////////////////////////
// VALUE STRUCTS
////////////////////////////////////////////////////////////////////////////////

template<typename ClassType>
class value_object : public internal::noncopyable {
public:
    typedef ClassType class_type;

    value_object(const char* name) {
        using namespace internal;

        auto ctor = &raw_constructor<ClassType>;
        auto dtor = &raw_destructor<ClassType>;

        facebook::jsi::Function constructorJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_constructor"),
                0,
                [ctor](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    ClassType* t = ctor();
                    return facebook::jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(t));
                });

        facebook::jsi::Function destructorJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_constructor"),
                1,
                [dtor](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    ClassType* t = reinterpret_cast<ClassType*>(args[0].asBigInt(rt).asUint64(rt));
                    dtor(t);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_value_object(
                TypeID<ClassType>::get(),
                name,
                getSignature(ctor),
                constructorJSIFunc,
                getSignature(dtor),
                destructorJSIFunc);
    }

    ~value_object() {
        using namespace internal;
        _embind_finalize_value_object(internal::TypeID<ClassType>::get());
    }

    template<typename InstanceType, typename FieldType>
    value_object& field(const char* fieldName, FieldType InstanceType::*field) {
        using namespace internal;

        auto getter = &MemberAccess<InstanceType, FieldType>
        ::template getWire2<ClassType>;
        auto setter = &MemberAccess<InstanceType, FieldType>
        ::template setWire2<ClassType>;

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_object_element_gter1"),
                2,
                [getter, field](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    return getter(field, *t2);
                });

        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_object_element_ster1"),
                3,
                [setter, field](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    setter(field, *t2, args[2]);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_value_object_field(
                TypeID<ClassType>::get(),
                fieldName,
                TypeID<FieldType>::get(),
                getSignature(getter),
                getterJSIFunc,
                getContext(field),
                TypeID<FieldType>::get(),
                getSignature(setter),
                setterJSIFunc,
                getContext(field));
        return *this;
    }

    template<typename InstanceType, typename ElementType, int N>
    value_object& field(const char* fieldName, ElementType (InstanceType::*field)[N]) {
        using namespace internal;

        typedef std::array<ElementType, N> FieldType;
        static_assert(sizeof(FieldType) == sizeof(ElementType[N]));

        auto getter = &MemberAccess<InstanceType, FieldType>
        ::template getWire2<ClassType>;
        auto setter = &MemberAccess<InstanceType, FieldType>
        ::template setWire2<ClassType>;

        typedef FieldType InstanceType::*MemberPointer;

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_object_element_gter1"),
                2,
                [getter, field](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    const MemberPointer* t1 = reinterpret_cast<MemberPointer*>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    return getter(*t1, *t2);
                });

        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_object_element_ster1"),
                3,
                [setter, field](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    const MemberPointer* t1 = reinterpret_cast<MemberPointer*>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    setter(*t1, *t2, args[2]);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_value_object_field(
                TypeID<ClassType>::get(),
                fieldName,
                TypeID<FieldType>::get(),
                getSignature(getter),
                getterJSIFunc,
                getContext(field),
                TypeID<FieldType>::get(),
                getSignature(setter),
                setterJSIFunc,
                getContext(field));
        return *this;
    }

    template<typename Getter, typename Setter>
    value_object& field(
            const char* fieldName,
            Getter getter,
            Setter setter
    ) {
        using namespace internal;
        typedef GetterPolicy<Getter> GP;
        typedef SetterPolicy<Setter> SP;

        auto g = &GP::template get2<ClassType>;
        auto s = &SP::template set2<ClassType>;

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_object_element_gter2"),
                2,
                [g, getter](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    Getter* t = reinterpret_cast<Getter*>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    return g(getter, *t2);
                });

        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_object_element_ster2"),
                3,
                [s](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    Setter* t = reinterpret_cast<Setter*>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    s(*t, *t2, args[2]);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_value_object_field(
                TypeID<ClassType>::get(),
                fieldName,
                TypeID<typename GP::ReturnType>::get(),
                getSignature(g),
                getterJSIFunc,
                GP::getContext(getter),
                TypeID<typename SP::ArgumentType>::get(),
                getSignature(s),
                setterJSIFunc,
                SP::getContext(setter));
        return *this;
    }

    template<int Index>
    value_object& field(const char* fieldName, index<Index>) {
        using namespace internal;
        ClassType* null = 0;
        typedef typename std::remove_reference<decltype((*null)[Index])>::type ElementType;

        auto getter = &internal::get_by_index<ClassType, ElementType>;
        auto setter = &internal::set_by_index<ClassType, ElementType>;

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_object_element_gter3"),
                2,
                [getter](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    int t1 = static_cast<int>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    return getter(t1, *t2);
                });

        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, "value_object_element_ster3"),
                3,
                [setter](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    int t1 = static_cast<int>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    setter(t1, *t2, args[2]);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_value_object_field(
                TypeID<ClassType>::get(),
                fieldName,
                TypeID<ElementType>::get(),
                getSignature(getter),
                getterJSIFunc,
                reinterpret_cast<void*>(Index),
                TypeID<ElementType>::get(),
                getSignature(setter),
                setterJSIFunc,
                reinterpret_cast<void*>(Index));
        return *this;
    }
};

////////////////////////////////////////////////////////////////////////////////
// SMART POINTERS
////////////////////////////////////////////////////////////////////////////////

template<typename PointerType>
struct default_smart_ptr_trait {
    static sharing_policy get_sharing_policy() {
        return sharing_policy::NONE;
    }

    static void* share(void* v) {
        return 0; // no sharing
    }

    static PointerType* construct_null() {
        return new PointerType;
    }
};

// specialize if you have a different pointer type
template<typename PointerType>
struct smart_ptr_trait : public default_smart_ptr_trait<PointerType> {
    typedef typename PointerType::element_type element_type;

    static element_type* get(const PointerType& ptr) {
        return ptr.get();
    }
};

template<typename PointeeType>
struct smart_ptr_trait<std::shared_ptr<PointeeType>> {
typedef std::shared_ptr<PointeeType> PointerType;
typedef typename PointerType::element_type element_type;

static element_type* get(const PointerType& ptr) {
    return ptr.get();
}

static sharing_policy get_sharing_policy() {
    return sharing_policy::BY_EMVAL;
}

static std::shared_ptr<PointeeType>* share(PointeeType* p, EM_VAL v) {
    return new std::shared_ptr<PointeeType>(
            p,
            val_deleter(val::take_ownership(v)));
}

static PointerType* construct_null() {
    return new PointerType;
}

private:
class val_deleter {
public:
    val_deleter() = delete;
    explicit val_deleter(val v)
            : v(v)
    {}
    void operator()(void const*) {
        v();
        // eventually we'll need to support emptied out val
        v = val::undefined();
    }
private:
    val v;
};
};


////////////////////////////////////////////////////////////////////////////////
// CLASSES
////////////////////////////////////////////////////////////////////////////////

namespace internal {

    class WrapperBase {
    public:
        void setNotifyJSOnDestruction(bool notify) {
            notifyJSOnDestruction = notify;
        }

    protected:
        bool notifyJSOnDestruction = false;
    };

} // end namespace internal

// abstract classes
template<typename T>
class wrapper : public T, public internal::WrapperBase {
public:
    typedef T class_type;

    template<typename... Args>
    explicit wrapper(val&& wrapped, Args&&... args)
            : T(std::forward<Args>(args)...)
            , wrapped(std::forward<val>(wrapped))
    {}

    ~wrapper() {
        if (notifyJSOnDestruction) {
            call<void>("__destruct");
        }
    }

    template<typename ReturnType, typename... Args>
    ReturnType call(const char* name, Args&&... args) const {
        return wrapped.call<ReturnType>(name, std::forward<Args>(args)...);
    }

private:
    val wrapped;
};

#define EMSCRIPTEN_WRAPPER(T)                                           \
template<typename... Args>                                          \
T(::emscripten::val&& v, Args&&... args)                            \
    : wrapper(std::forward<::emscripten::val>(v), std::forward<Args>(args)...) \
{}

namespace internal {

    struct NoBaseClass {
        template<typename ClassType>
        static void verify() {
        }

        static TYPEID get() {
            return nullptr;
        }

        template<typename ClassType>
        static VoidFunctionPtr getUpcaster() {
            return nullptr;
        }

        template<typename ClassType>
        static VoidFunctionPtr getDowncaster() {
            return nullptr;
        }
    };

// NOTE: this returns the class type, not the pointer type
    template<typename T>
    inline TYPEID getActualType(T* ptr) {
        return getLightTypeID(*ptr);
    };

} // end namespace internal

template<typename BaseClass>
struct base {
    typedef BaseClass class_type;

    template<typename ClassType>
    static void verify() {
        static_assert(!std::is_same<ClassType, BaseClass>::value, "Base must not have same type as class");
        static_assert(std::is_base_of<BaseClass, ClassType>::value, "Derived class must derive from base");
    }

    static internal::TYPEID get() {
        return internal::TypeID<BaseClass>::get();
    }

    template<typename ClassType>
    using Upcaster = BaseClass* (*)(ClassType*);

    template<typename ClassType>
    using Downcaster = ClassType* (*)(BaseClass*);

    template<typename ClassType>
    static Upcaster<ClassType> getUpcaster() {
        return &convertPointer<ClassType, BaseClass>;
    }

    template<typename ClassType>
    static Downcaster<ClassType> getDowncaster() {
        return &convertPointer<BaseClass, ClassType>;
    }

    template<typename From, typename To>
    static To* convertPointer(From* ptr) {
        return static_cast<To*>(ptr);
    }
};

namespace internal {

    template<typename WrapperType>
    val wrapped_extend(const std::string& name, const val& properties) {
        return val::take_ownership(_embind_create_inheriting_constructor(
                name.c_str(),
                TypeID<WrapperType>::get(),
                properties.as_handle()));
    }

} // end namespace internal

struct pure_virtual {
    template<typename InputType, int Index>
    struct Transform {
        typedef InputType type;
    };
};

namespace internal {

    template<typename... Policies>
    struct isPureVirtual;

    template<typename... Rest>
    struct isPureVirtual<pure_virtual, Rest...> {
        static constexpr bool value = true;
    };

    template<typename T, typename... Rest>
    struct isPureVirtual<T, Rest...> {
        static constexpr bool value = isPureVirtual<Rest...>::value;
    };

    template<>
    struct isPureVirtual<> {
        static constexpr bool value = false;
    };

    struct DeduceArgumentsTag {};

////////////////////////////////////////////////////////////////////////////
// RegisterClassConstructor
////////////////////////////////////////////////////////////////////////////

    template <typename T>
    struct RegisterClassConstructor;

    template<typename ReturnType, typename... Args>
    struct RegisterClassConstructor<ReturnType (*)(Args...)> {

        template <typename ClassType, typename... Policies>
        static void invoke(ReturnType (*factory)(Args...)) {
            typename WithPolicies<allow_raw_pointers, Policies...>::template ArgTypeList<ReturnType, Args...> args;
            auto invoke = &Invoker<ReturnType, Args...>::invoke2;

            facebook::jsi::Function invokeJSIFunc = facebook::jsi::Function::createFromHostFunction(
                    *jsRuntime,
                    facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string("RegisterClassConstructor_invoke_")+getSignature(invoke)),
                    args.getCount() - 1,
                    [invoke, factory](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                        if constexpr (std::is_same<ReturnType, void>::value) {
                        callInvokeVoid(sizeof...(Args), invoke, factory);
                        return nullptr;
                    } else {
                        callInvoke(sizeof...(Args), invoke, factory);
                    }
                    });

            _embind_register_class_constructor(
                    TypeID<ClassType>::get(),
                    args.getCount(),
                    args.getTypes(),
                    getSignature(invoke),
                    invokeJSIFunc,
                    reinterpret_cast<GenericFunction>(factory));
        }
    };

    template<typename ReturnType, typename... Args>
    struct RegisterClassConstructor<std::function<ReturnType (Args...)>> {

    template <typename ClassType, typename... Policies>
    static void invoke(std::function<ReturnType (Args...)> factory) {
        typename WithPolicies<Policies...>::template ArgTypeList<ReturnType, Args...> args;
        auto invoke = &FunctorInvoker<decltype(factory), ReturnType, Args...>::invoke2;

        facebook::jsi::Function invokeJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string("RegisterClassConstructor_invoke_")+getSignature(invoke)),
                args.getCount() - 1,
                [invoke, factory](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    if constexpr (std::is_same<ReturnType, void>::value) {
                        callInvokeVoid(sizeof...(Args), invoke, factory);
                        return nullptr;
                    } else {
                        callInvoke(sizeof...(Args), invoke, factory);
                    }
                });

        _embind_register_class_constructor(
                TypeID<ClassType>::get(),
                args.getCount(),
                args.getTypes(),
                getSignature(invoke),
                invokeJSIFunc,
                reinterpret_cast<GenericFunction>(getContext(factory)));
    }
};

template<typename ReturnType, typename... Args>
struct RegisterClassConstructor<ReturnType (Args...)> {

    template <typename ClassType, typename Callable, typename... Policies>
    static void invoke(Callable& factory) {
        typename WithPolicies<Policies...>::template ArgTypeList<ReturnType, Args...> args;
        auto invoke = &FunctorInvoker<decltype(factory), ReturnType, Args...>::invoke2;

        facebook::jsi::Function invokeJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string("RegisterClassConstructor_invoke_")+getSignature(invoke)),
                args.getCount() - 1,
                [invoke, factory](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    if constexpr (std::is_same<ReturnType, void>::value) {
                        callInvokeVoid(sizeof...(Args), invoke, getContext(factory));
                        return nullptr;
                    } else {
                        callInvoke(sizeof...(Args), invoke, getContext(factory));
                    }
                });

        _embind_register_class_constructor(
                TypeID<ClassType>::get(),
                args.getCount(),
                args.getTypes(),
                getSignature(invoke),
                invokeJSIFunc,
                reinterpret_cast<GenericFunction>(getContext(factory)));
    }
};

////////////////////////////////////////////////////////////////////////////
// RegisterClassMethod
////////////////////////////////////////////////////////////////////////////

template <typename T>
struct RegisterClassMethod;

template<typename ClassType, typename ReturnType, typename... Args>
struct RegisterClassMethod<ReturnType (ClassType::*)(Args...)> {

    template <typename CT, typename... Policies>
    static void invoke(facebook::jsi::Runtime* rt, const char* methodName,
                       ReturnType (ClassType::*memberFunction)(Args...)) {
        using OriginalInvoker = MethodInvoker<decltype(memberFunction), ReturnType, ClassType*, Args...>;
        auto invoke = &maybe_wrap_async<OriginalInvoker, Policies...>::invoke2;

        typename WithPolicies<Policies...>::template ArgTypeList<ReturnType, AllowedRawPointer<ClassType>, Args...> args;
        auto a = getContext(memberFunction);

        facebook::jsi::Function invokeJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *rt,
                facebook::jsi::PropNameID::forAscii(*rt, std::string(methodName)+"_"+getSignature(invoke)),
                args.getCount() + 1,
                [invoke, a, memberFunction](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    if constexpr (std::is_same<ReturnType, void>::value) {
                    callInvokeVoid(sizeof...(Args) + 1, invoke, memberFunction);
                    return nullptr;
                } else {
                    callInvoke(sizeof...(Args) + 1, invoke, memberFunction);
                }
                });

        _embind_register_class_function(
                TypeID<ClassType>::get(),
                methodName,
                args.getCount(),
                args.getTypes(),
                getSignature(invoke),
                invokeJSIFunc,
                getContext(memberFunction),
                isPureVirtual<Policies...>::value,
                isAsync<Policies...>::value);
    }
};

#ifdef __cpp_noexcept_function_type
template<typename ClassType, typename ReturnType, typename... Args>
struct RegisterClassMethod<ReturnType (ClassType::*)(Args...) noexcept>
     : RegisterClassMethod<ReturnType (ClassType::*)(Args...)> {};
#endif

template<typename ClassType, typename ReturnType, typename... Args>
struct RegisterClassMethod<ReturnType (ClassType::*)(Args...) const> {

    template <typename CT, typename... Policies>
    static void invoke(facebook::jsi::Runtime* rt, const char* methodName,
                       ReturnType (ClassType::*memberFunction)(Args...) const)  {
        using OriginalInvoker = MethodInvoker<decltype(memberFunction), ReturnType, const ClassType*, Args...>;
        auto invoke = &maybe_wrap_async<OriginalInvoker, Policies...>::invoke2;

        typename WithPolicies<Policies...>::template ArgTypeList<ReturnType, AllowedRawPointer<const ClassType>, Args...> args;
        auto a = getContext(memberFunction);

        facebook::jsi::Function invokeJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *rt,
                facebook::jsi::PropNameID::forAscii(*rt, std::string(methodName)+"_"+getSignature(invoke)),
                args.getCount() + 1,
                [invoke, a, memberFunction](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    if constexpr (std::is_same<ReturnType, void>::value) {
                    callInvokeVoid(sizeof...(Args) + 1, invoke, memberFunction);
                    return nullptr;
                } else {
                    callInvoke(sizeof...(Args) + 1, invoke, memberFunction);
                }
                });

        _embind_register_class_function(
                TypeID<ClassType>::get(),
                methodName,
                args.getCount(),
                args.getTypes(),
                getSignature(invoke),
                invokeJSIFunc,
                getContext(memberFunction),
                isPureVirtual<Policies...>::value,
                isAsync<Policies...>::value);
    }
};

#ifdef __cpp_noexcept_function_type
template<typename ClassType, typename ReturnType, typename... Args>
struct RegisterClassMethod<ReturnType (ClassType::*)(Args...) const noexcept>
     : RegisterClassMethod<ReturnType (ClassType::*)(Args...) const> {};
#endif

template<typename ReturnType, typename ThisType, typename... Args>
struct RegisterClassMethod<ReturnType (*)(ThisType, Args...)> {

    template <typename ClassType, typename... Policies>
    static void invoke(facebook::jsi::Runtime* rt, const char* methodName,
                       ReturnType (*function)(ThisType, Args...)) {
        typename WithPolicies<Policies...>::template ArgTypeList<ReturnType, ThisType, Args...> args;
        using OriginalInvoker = FunctionInvoker<decltype(function), ReturnType, ThisType, Args...>;
        auto invoke = &maybe_wrap_async<OriginalInvoker, Policies...>::invoke2;

        facebook::jsi::Function invokeJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *rt,
                facebook::jsi::PropNameID::forAscii(*rt, std::string(methodName)+"_"+getSignature(invoke)),
                args.getCount() + 1,
                [invoke, function](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    if constexpr (std::is_same<ReturnType, void>::value) {
                        callInvokeVoid(sizeof...(Args) + 1, invoke, getContext(function));
                        return nullptr;
                    } else {
                        callInvoke(sizeof...(Args) + 1, invoke, getContext(function));
                    }
                });

        _embind_register_class_function(
                TypeID<ClassType>::get(),
                methodName,
                args.getCount(),
                args.getTypes(),
                getSignature(invoke),
                invokeJSIFunc,
                getContext(function),
                false,
                isAsync<Policies...>::value);
    }
};

#ifdef __cpp_noexcept_function_type
template<typename ReturnType, typename ThisType, typename... Args>
struct RegisterClassMethod<ReturnType (*)(ThisType, Args...) noexcept>
     : RegisterClassMethod<ReturnType (*)(ThisType, Args...)> {};
#endif

template<typename ReturnType, typename ThisType, typename... Args>
struct RegisterClassMethod<std::function<ReturnType (ThisType, Args...)>> {

template <typename ClassType, typename... Policies>
static void invoke(facebook::jsi::Runtime* rt, const char* methodName,
                   std::function<ReturnType (ThisType, Args...)> function) {
    typename WithPolicies<Policies...>::template ArgTypeList<ReturnType, ThisType, Args...> args;
    using OriginalInvoker = FunctorInvoker<decltype(function), ReturnType, ThisType, Args...>;
    auto invoke = &maybe_wrap_async<OriginalInvoker, Policies...>::invoke2;

    facebook::jsi::Function invokeJSIFunc = facebook::jsi::Function::createFromHostFunction(
            *rt,
            facebook::jsi::PropNameID::forAscii(*rt, std::string(methodName)+"_"+getSignature(invoke)),
            args.getCount() + 1,
            [invoke, function](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                if constexpr (std::is_same<ReturnType, void>::value) {
                callInvokeVoid(sizeof...(Args) + 1, invoke, function);
                return nullptr;
            } else {
                callInvoke(sizeof...(Args) + 1, invoke, function);
            }
            });

    _embind_register_class_function(
            TypeID<ClassType>::get(),
            methodName,
            args.getCount(),
            args.getTypes(),
            getSignature(invoke),
            invokeJSIFunc,
            getContext(function),
            false,
            isAsync<Policies...>::value);
}
};

template<typename ReturnType, typename ThisType, typename... Args>
struct RegisterClassMethod<ReturnType (ThisType, Args...)> {

    template <typename ClassType, typename Callable, typename... Policies>
    static void invoke(facebook::jsi::Runtime* rt, const char* methodName,
                       Callable& callable) {
        typename WithPolicies<Policies...>::template ArgTypeList<ReturnType, ThisType, Args...> args;
        using OriginalInvoker = FunctorInvoker<decltype(callable), ReturnType, ThisType, Args...>;
        auto invoke = &maybe_wrap_async<OriginalInvoker, Policies...>::invoke2;

        facebook::jsi::Function invokeJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *rt,
                facebook::jsi::PropNameID::forAscii(*rt, std::string(methodName)+"_"+getSignature(invoke)),
                args.getCount() + 1,
                [invoke, callable](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    if constexpr (std::is_same<ReturnType, void>::value) {
                    callInvokeVoid(sizeof...(Args) + 1, invoke, callable);
                    return nullptr;
                } else {
                    callInvoke(sizeof...(Args) + 1, invoke, callable);
                }
                });

        _embind_register_class_function(
                TypeID<ClassType>::get(),
                methodName,
                args.getCount(),
                args.getTypes(),
                getSignature(invoke),
                invokeJSIFunc,
                getContext(callable),
                false,
                isAsync<Policies...>::value);
    }
};

} // end namespace internal

template<typename... ConstructorArgs>
struct constructor {
};

template<typename ClassType, typename BaseSpecifier>
facebook::jsi::Value dsadsa(facebook::jsi::Runtime& rt, ClassType* rawValue, BaseSpecifier*);

template<typename ClassType, typename BaseSpecifier>
facebook::jsi::Value dsadsa(facebook::jsi::Runtime& rt, ClassType* rawValue, BaseSpecifier*) {
    auto upcast   = BaseSpecifier::template getUpcaster<ClassType>();
    auto r = upcast(rawValue);
    return facebook::jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(r));
}

template<typename ClassType, typename BaseSpecifier>
facebook::jsi::Value dsadsa(facebook::jsi::Runtime& rt, ClassType* rawValue, internal::NoBaseClass*) {
    return facebook::jsi::Value::undefined();
}


template<typename ClassType, typename BaseSpecifier>
facebook::jsi::Value downcastHelper(facebook::jsi::Runtime& rt, ClassType* rawValue, BaseSpecifier*);

template<typename ClassType, typename BaseSpecifier>
facebook::jsi::Value downcastHelper(facebook::jsi::Runtime& rt, ClassType* rawValue, BaseSpecifier*) {
    auto downcast = BaseSpecifier::template getDowncaster<ClassType>();
    auto r = downcast(rawValue);
    return facebook::jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(r));
}

template<typename ClassType, typename BaseSpecifier>
facebook::jsi::Value downcastHelper(facebook::jsi::Runtime& rt, ClassType* rawValue, internal::NoBaseClass*) {
    return facebook::jsi::Value::undefined();
}

template<typename ClassType, typename BaseSpecifier = internal::NoBaseClass>
class class_ {
public:
    typedef ClassType class_type;
    typedef BaseSpecifier base_specifier;

    class_() = delete;

    EMSCRIPTEN_ALWAYS_INLINE explicit class_(const char* name) {
        using namespace internal;

        BaseSpecifier::template verify<ClassType>();

        auto _getActualType = &getActualType<ClassType>;
        auto upcast   = BaseSpecifier::template getUpcaster<ClassType>();
        auto downcast = BaseSpecifier::template getDowncaster<ClassType>();
        auto destructor = &raw_destructor<ClassType>;

        facebook::jsi::Function _getActualTypeJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"__getActualType"),
                1,
                [_getActualType](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    auto returnValue = _getActualType(reinterpret_cast<ClassType*>(args[0].asBigInt(rt).asUint64(rt)));
                    return facebook::jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(returnValue));
                });

        facebook::jsi::Function upcastJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_upcast"),
                1,
                [upcast](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    ClassType* t = reinterpret_cast<ClassType*>(args[0].asBigInt(rt).asUint64(rt));
                    BaseSpecifier* a = nullptr;
                    return dsadsa<ClassType, BaseSpecifier>(rt, t, a);
                });

        facebook::jsi::Function downcastJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_downcast"),
                1,
                [downcast](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    ClassType* t = reinterpret_cast<ClassType*>(args[0].asBigInt(rt).asUint64(rt));
                    BaseSpecifier* a = nullptr;
                    return downcastHelper<ClassType, BaseSpecifier>(rt, t, a);
                });

        facebook::jsi::Function destructorJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_destructor"),
                1,
                [destructor](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    destructor(reinterpret_cast<ClassType*>(args[0].asBigInt(rt).asUint64(rt)));
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_class(
                TypeID<ClassType>::get(),
                TypeID<AllowedRawPointer<ClassType>>::get(),
                TypeID<AllowedRawPointer<const ClassType>>::get(),
                BaseSpecifier::get(),
                getSignature(_getActualType),
                _getActualTypeJSIFunc,
                getSignature(upcast),
                upcastJSIFunc,
                getSignature(downcast),
                downcastJSIFunc,
                name,
                getSignature(destructor),
                destructorJSIFunc);
    }

    template<typename PointerType>
    EMSCRIPTEN_ALWAYS_INLINE const class_& smart_ptr(const char* name) const {
        using namespace internal;

        typedef smart_ptr_trait<PointerType> PointerTrait;
        typedef typename PointerTrait::element_type PointeeType;

        static_assert(std::is_same<ClassType, typename std::remove_cv<PointeeType>::type>::value, "smart pointer must point to this class");

        auto get = &PointerTrait::get;
        auto construct_null = &PointerTrait::construct_null;
        auto share = &PointerTrait::share;
        auto destructor = &raw_destructor<PointerType>;

        facebook::jsi::Function getJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_get"),
                1,
                [get](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    uint64_t ptrNumber = args[0].asBigInt(rt).asUint64(rt);
                    auto b = *reinterpret_cast<PointerType*>(ptrNumber);
                    auto a = get(b);
                    return facebook::jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(a));
                });

        facebook::jsi::Function construct_nullJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_construct_null"),
                1,
                [construct_null](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    auto a = construct_null();
                    return facebook::jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(a));
                });

        facebook::jsi::Function shareJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_share"),
                2,
                [share](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    uint64_t pNumber = args[0].asBigInt(rt).asUint64(rt);
                    auto p = reinterpret_cast<PointeeType*>(pNumber);
                    // uint64_t vNumber = (uint64_t) args[1].getNumber();
                    uint64_t vNumber = args[1].asBigInt(rt).asUint64(rt);
                    EM_VAL v = reinterpret_cast<EM_VAL>(vNumber);
                    auto a = share(p, v);
                    auto e = facebook::jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(a));
                    return e;
                });

        facebook::jsi::Function destructorJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_destructor"),
                1,
                [destructor](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    uint64_t ptrNumber = args[0].asBigInt(rt).asUint64(rt);
                    auto b = reinterpret_cast<PointerType*>(ptrNumber);
                    destructor(b);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_smart_ptr(
                TypeID<PointerType>::get(),
                TypeID<PointeeType>::get(),
                name,
                PointerTrait::get_sharing_policy(),
                getSignature(get),
                getJSIFunc,
                getSignature(construct_null),
                construct_nullJSIFunc,
                getSignature(share),
                shareJSIFunc,
                getSignature(destructor),
                destructorJSIFunc);
        return *this;
    };

    template<typename... ConstructorArgs, typename... Policies>
    EMSCRIPTEN_ALWAYS_INLINE const class_& constructor(Policies... policies) const {
        return constructor(
                &internal::operator_new<ClassType, ConstructorArgs...>,
                policies...);
    }

    template<typename Signature = internal::DeduceArgumentsTag, typename Callable, typename... Policies>
    EMSCRIPTEN_ALWAYS_INLINE const class_& constructor(Callable callable, Policies...) const {

        using invoker = internal::RegisterClassConstructor<
                typename std::conditional<std::is_same<Signature, internal::DeduceArgumentsTag>::value,
                        Callable,
                        Signature>::type>;

        invoker::template invoke<ClassType, Policies...>(callable);
        return *this;
    }

    template<typename SmartPtr, typename... Args, typename... Policies>
    EMSCRIPTEN_ALWAYS_INLINE const class_& smart_ptr_constructor(const char* smartPtrName, SmartPtr (*factory)(Args...), Policies...) const {
        using namespace internal;

        // smart_ptr<SmartPtr>(smartPtrName);

        typename WithPolicies<Policies...>::template ArgTypeList<SmartPtr, Args...> args;
        auto invoke = &Invoker<SmartPtr, Args...>::invoke2;

        facebook::jsi::Function invokeJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(smartPtrName)+"_"+getSignature(invoke)),
                args.getCount() - 1,
                [invoke, factory](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    callInvoke(sizeof...(Args), invoke, factory);
                });

        _embind_register_class_constructor(
                TypeID<ClassType>::get(),
                args.getCount(),
                args.getTypes(),
                getSignature(invoke),
                invokeJSIFunc,
                reinterpret_cast<GenericFunction>(factory));
        return *this;
    }

    template<typename WrapperType, typename... ConstructorArgs>
    EMSCRIPTEN_ALWAYS_INLINE const class_& allow_subclass(
            const char* wrapperClassName,
            ::emscripten::constructor<ConstructorArgs...> = ::emscripten::constructor<>()
    ) const {
        using namespace internal;

        auto cls = class_<WrapperType, base<ClassType>>(wrapperClassName)
                .function("notifyOnDestruction", select_overload<void(WrapperType&)>([](WrapperType& wrapper) {
                    wrapper.setNotifyJSOnDestruction(true);
                }))
        ;

        return
                class_function(
                        "implement",
                        &wrapped_new<WrapperType*, WrapperType, val, ConstructorArgs...>,
                        allow_raw_pointer<ret_val>())
        .class_function(
                "extend",
                &wrapped_extend<WrapperType>)
                ;
    }

    template<typename WrapperType, typename PointerType, typename... ConstructorArgs>
    EMSCRIPTEN_ALWAYS_INLINE const class_& allow_subclass(
            const char* wrapperClassName,
            const char* pointerName,
            ::emscripten::constructor<ConstructorArgs...> = ::emscripten::constructor<>()
    ) const {
        using namespace internal;

        auto cls = class_<WrapperType, base<ClassType>>(wrapperClassName)
                .function("notifyOnDestruction", select_overload<void(WrapperType&)>([](WrapperType& wrapper) {
                    wrapper.setNotifyJSOnDestruction(true);
                }))
                .template smart_ptr<PointerType>(pointerName)
        ;

        return
                class_function(
                        "implement",
                        &wrapped_new<PointerType, WrapperType, val, ConstructorArgs...>,
                        allow_raw_pointer<ret_val>())
        .class_function(
                "extend",
                &wrapped_extend<WrapperType>)
                ;
    }

    template<typename Signature = internal::DeduceArgumentsTag, typename Callable, typename... Policies>
    EMSCRIPTEN_ALWAYS_INLINE const class_& function(const char* methodName, Callable callable, Policies...) const {
        using invoker = internal::RegisterClassMethod<
                typename std::conditional<std::is_same<Signature, internal::DeduceArgumentsTag>::value,
                        Callable,
                        Signature>::type>;

        invoker::template invoke<ClassType, Policies...>(jsRuntime, methodName, callable);
        return *this;
    }

    template<typename FieldType, typename = typename std::enable_if<!std::is_function<FieldType>::value>::type>
    EMSCRIPTEN_ALWAYS_INLINE const class_& property(const char* fieldName, const FieldType ClassType::*field) const {
        using namespace internal;

        auto getter = &MemberAccess<ClassType, FieldType>::template getWire2<ClassType>;
        FieldType ClassType::* a = const_cast<FieldType ClassType::*>(field);

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(fieldName)+"_gter"),
                2,
                [getter, a](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    return getter(a, *t2);
                });

        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(fieldName)+"_ster"),
                0,
                [](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_class_property(
                TypeID<ClassType>::get(),
                fieldName,
                TypeID<FieldType>::get(),
                getSignature(getter),
                getterJSIFunc,
                getContext(field),
                0,
                "",
                setterJSIFunc,
                0);
        return *this;
    }

    template<typename FieldType, typename = typename std::enable_if<!std::is_function<FieldType>::value>::type>
    EMSCRIPTEN_ALWAYS_INLINE const class_& property(const char* fieldName, FieldType ClassType::*field) const {
        using namespace internal;

        auto getter = &MemberAccess<ClassType, FieldType>::template getWire2<ClassType>;
        auto setter = &MemberAccess<ClassType, FieldType>::template setWire2<ClassType>;

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(fieldName)+"_gter"),
                2,
                [getter, field](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    FieldType* t = reinterpret_cast<FieldType*>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    return getter(field, *t2);
                });

        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(fieldName)+"_ster"),
                3,
                [setter, field](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    FieldType* t = reinterpret_cast<FieldType*>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    setter(field, *t2, args[2]);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_class_property(
                TypeID<ClassType>::get(),
                fieldName,
                TypeID<FieldType>::get(),
                getSignature(getter),
                getterJSIFunc,
                getContext(field),
                TypeID<FieldType>::get(),
                getSignature(setter),
                setterJSIFunc,
                getContext(field));
        return *this;
    }

    template<typename PropertyType = internal::DeduceArgumentsTag, typename Getter>
    EMSCRIPTEN_ALWAYS_INLINE const class_& property(const char* fieldName, Getter getter) const {
        using namespace internal;

        typedef GetterPolicy<
                typename std::conditional<std::is_same<PropertyType, internal::DeduceArgumentsTag>::value,
                        Getter,
        PropertyTag<Getter, PropertyType>>::type> GP;

        auto gter = &GP::template get2<ClassType>;

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(fieldName) + "_gter"),
                2,
                [gter](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    Getter* t = reinterpret_cast<Getter*>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    return gter(*t, *t2);
                });

        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(fieldName)+"_ster"),
                3,
                [](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_class_property(
                TypeID<ClassType>::get(),
                fieldName,
                TypeID<typename GP::ReturnType>::get(),
                getSignature(gter),
                getterJSIFunc,
                GP::getContext(getter),
                0,
                "",
                setterJSIFunc,
                0);
        return *this;
    }

    template<typename PropertyType = internal::DeduceArgumentsTag, typename Getter, typename Setter>
    EMSCRIPTEN_ALWAYS_INLINE const class_& property(const char* fieldName, Getter getter, Setter setter) const {
        using namespace internal;

        typedef GetterPolicy<
                typename std::conditional<std::is_same<PropertyType, internal::DeduceArgumentsTag>::value,
                        Getter,
        PropertyTag<Getter, PropertyType>>::type> GP;
        typedef SetterPolicy<
                typename std::conditional<std::is_same<PropertyType, internal::DeduceArgumentsTag>::value,
                        Setter,
        PropertyTag<Setter, PropertyType>>::type> SP;


        auto gter = &GP::template get2<ClassType>;
        auto ster = &SP::template set2<ClassType>;

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(fieldName)+"_gter"),
                2,
                [gter](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    Getter* t = reinterpret_cast<Getter*>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    return gter(*t, *t2);
                });

        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(fieldName)+"_ster"),
                3,
                [ster](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    Setter* t = reinterpret_cast<Setter*>(args[0].asBigInt(rt).asUint64(rt));
                    ClassType* t2 = reinterpret_cast<ClassType*>(args[1].asBigInt(rt).asUint64(rt));
                    ster(*t, *t2, args[2]);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_class_property(
                TypeID<ClassType>::get(),
                fieldName,
                TypeID<typename GP::ReturnType>::get(),
                getSignature(gter),
                getterJSIFunc,
                GP::getContext(getter),
                TypeID<typename SP::ArgumentType>::get(),
                getSignature(ster),
                setterJSIFunc,
                SP::getContext(setter));
        return *this;
    }

    template<typename ReturnType, typename... Args, typename... Policies>
    EMSCRIPTEN_ALWAYS_INLINE const class_& class_function(const char* methodName, ReturnType (*classMethod)(Args...), Policies...) const {
        using namespace internal;

        typename WithPolicies<Policies...>::template ArgTypeList<ReturnType, Args...> args;
        using OriginalInvoker = internal::Invoker<ReturnType, Args...>;
        auto invoke = &maybe_wrap_async<OriginalInvoker, Policies...>::invoke2;

        facebook::jsi::Function invokeJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(methodName)+"_"+getSignature(invoke)),
                args.getCount() - 1,
                [invoke, classMethod](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    if constexpr (std::is_same<ReturnType, void>::value) {
                    callInvokeVoid(sizeof...(Args), invoke, classMethod);
                    return nullptr;
                } else {
                    callInvoke(sizeof...(Args), invoke, classMethod);
                }
                });

        _embind_register_class_class_function(
                TypeID<ClassType>::get(),
                methodName,
                args.getCount(),
                args.getTypes(),
                getSignature(invoke),
                invokeJSIFunc,
                reinterpret_cast<GenericFunction>(classMethod),
                isAsync<Policies...>::value);
        return *this;
    }

    template<typename FieldType>
    EMSCRIPTEN_ALWAYS_INLINE const class_& class_property(const char* name, const FieldType* field) const {
        using namespace internal;

        auto getter = &GlobalAccess<FieldType>::get2;

        FieldType* a = const_cast<FieldType*>(field);

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_"+getSignature(getter)),
                1,
                [getter, a](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    return getter(a);
                });


        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_null_setter"),
                2,
                [](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_class_class_property(
                TypeID<ClassType>::get(),
                name,
                TypeID<FieldType>::get(),
                a,
                getSignature(getter),
                getterJSIFunc,
                "",
                setterJSIFunc);
        return *this;
    }

    template<typename FieldType>
    EMSCRIPTEN_ALWAYS_INLINE const class_& class_property(const char* name, FieldType* field) const {
        using namespace internal;

        auto getter = &GlobalAccess<FieldType>::get2;
        auto setter = &GlobalAccess<FieldType>::set2;

        facebook::jsi::Function getterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_"+getSignature(getter)),
                1,
                [getter, field](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    return getter(field);
                });


        facebook::jsi::Function setterJSIFunc = facebook::jsi::Function::createFromHostFunction(
                *jsRuntime,
                facebook::jsi::PropNameID::forAscii(*jsRuntime, std::string(name)+"_"+getSignature(setter)),
                2,
                [setter, field](facebook::jsi::Runtime& rt, const facebook::jsi::Value& thisVal, const facebook::jsi::Value* args, size_t count) {
                    setter(field, args[1]);
                    return facebook::jsi::Value::undefined();
                });

        _embind_register_class_class_property(
                TypeID<ClassType>::get(),
                name,
                TypeID<FieldType>::get(),
                field,
                getSignature(getter),
                getterJSIFunc,
                getSignature(setter),
                setterJSIFunc);
        return *this;
    }
};

////////////////////////////////////////////////////////////////////////////////
// VECTORS
////////////////////////////////////////////////////////////////////////////////

namespace internal {

    template<typename VectorType, typename Type>
    struct VectorAccess {
        static val get(
                const VectorType& v,
                int index
        ) {
            if (index < v.size()) {
                return val(v[index]);
            } else {
                return val::undefined();
            }
        }

        static bool set(
                VectorType& v,
                int index,
                const typename VectorType::value_type& value
        ) {
            v[index] = value;
            return true;
        }
    };

} // end namespace internal

template<typename T>
class_<std::vector<T>> register_vector(const char* name) {
    typedef std::vector<T> VecType;

    void (VecType::*push_back)(const T&) = &VecType::push_back;
    void (VecType::*resize)(const size_t, const T&) = &VecType::resize;
    size_t (VecType::*size)() const = &VecType::size;
    return class_<std::vector<T>>(name)
            .template constructor<>()
            .function("push_back", push_back)
            .function("resize", resize)
            .function("size", size)
            .function("get", &internal::VectorAccess<VecType, T>::get)
            .function("set", &internal::VectorAccess<VecType, T>::set)
            ;
}

////////////////////////////////////////////////////////////////////////////////
// MAPS
////////////////////////////////////////////////////////////////////////////////

namespace internal {

    template<typename MapType>
    struct MapAccess {
        static val get(
                const MapType& m,
                const typename MapType::key_type& k
        ) {
            auto i = m.find(k);
            if (i == m.end()) {
                return val::undefined();
            } else {
                return val(i->second);
            }
        }

        static void set(
                MapType& m,
                const typename MapType::key_type& k,
                const typename MapType::mapped_type& v
        ) {
            m[k] = v;
        }

        static std::vector<typename MapType::key_type> keys(
                const MapType& m
        ) {
            std::vector<typename MapType::key_type> keys;
            keys.reserve(m.size());
            for (const auto& pair : m) {
                keys.push_back(pair.first);
            }
            return keys;
        }
    };

} // end namespace internal

template<typename K, typename V>
class_<std::map<K, V>> register_map(const char* name) {
    typedef std::map<K,V> MapType;

    size_t (MapType::*size)() const = &MapType::size;
    return class_<MapType>(name)
            .template constructor<>()
            .function("size", size)
            .function("get", internal::MapAccess<MapType>::get)
            .function("set", internal::MapAccess<MapType>::set)
            .function("keys", internal::MapAccess<MapType>::keys)
            ;
}


////////////////////////////////////////////////////////////////////////////////
// ENUMS
////////////////////////////////////////////////////////////////////////////////

template<typename EnumType>
class enum_ {
public:
    typedef EnumType enum_type;

    enum_(const char* name) {
        using namespace internal;
        _embind_register_enum(
                internal::TypeID<EnumType>::get(),
                name,
                sizeof(EnumType),
                std::is_signed<typename std::underlying_type<EnumType>::type>::value);
    }

    enum_& value(const char* name, EnumType value) {
        using namespace internal;
        // TODO: there's still an issue here.
        // if EnumType is an unsigned long, then JS may receive it as a signed long
        static_assert(sizeof(value) <= sizeof(internal::GenericEnumValue), "enum type must fit in a GenericEnumValue");

        _embind_register_enum_value(
                internal::TypeID<EnumType>::get(),
                name,
                static_cast<internal::GenericEnumValue>(value));
        return *this;
    }
};

////////////////////////////////////////////////////////////////////////////////
// CONSTANTS
////////////////////////////////////////////////////////////////////////////////

namespace internal {

    template<typename T> double asGenericValue(T t) {
        return static_cast<double>(t);
    }

    template<typename T> uint64_t asGenericValue(T* p) {
        return reinterpret_cast<uint64_t>(p);
    }

    template<typename T> std::string asGenericValue(std::string p) {
        return p;
    }

}

template<typename ConstantType>
void constant(const char* name, const ConstantType& v) {
    using namespace internal;
    typedef BindingType<const ConstantType&> BT;
    _embind_register_constant(
            name,
            TypeID<const ConstantType&>::get(),
            BT::toWireType2(*jsRuntime, v)
            );
}

// EMSCRIPTEN_BINDINGS creates a static struct to initialize the binding which
// will get included in the program if the translation unit in which it is
// defined gets linked into the program. Using a C++ constructor here ensures it
// occurs after any other C++ constructors in this file, which is not true for
// __attribute__((constructor)) (they run before C++ constructors in the same
// file).
#define EMSCRIPTEN_BINDINGS(name)                                              \
  static void embind_init_##name();                                            \
  static struct EmBindInit_##name : emscripten::internal::InitFunc {           \
    EmBindInit_##name() : InitFunc(embind_init_##name) {}                      \
  } EmBindInit_##name##_instance;                                              \
  static void embind_init_##name()

} // end namespace emscripten
