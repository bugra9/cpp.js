// Copyright 2012 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

#include "./bind.h"
#ifdef USE_CXA_DEMANGLE
#include <../lib/libcxxabi/include/cxxabi.h>
#endif
#include <algorithm>
#include <climits>
// #include <emscripten/emscripten.h>
#include "./wire.h"
#include <limits>
#include <list>
#include <typeinfo>
#include <vector>
#include <string.h>

#include <any>
#include <unordered_map>


using namespace emscripten;
using namespace internal;
using namespace facebook;

namespace emscripten {
    facebook::jsi::Runtime* jsRuntime = nullptr;
    namespace internal {

        template<typename T>
        struct Bugra {
            static jsi::Value toValue(T rawValue);
            static jsi::Value toValue(T* rawValue);
            static jsi::Value toValue(T** rawValue);
            static jsi::Array toArrayValue(std::vector<T> rawValue);

            static T fromValue(jsi::Value& rawValue);
        };

        template<typename T>
        jsi::Value Bugra<T>::toValue(T rawValue) {
            return jsi::Value(rawValue);
        }

        template<typename T>
        jsi::Value Bugra<T>::toValue(T* rawValue) {
            return jsi::BigInt::fromUint64(*jsRuntime, reinterpret_cast<uint64_t>(rawValue));
        }

        template<typename T>
        jsi::Value Bugra<T>::toValue(T** rawValue) {
            return jsi::BigInt::fromUint64(*jsRuntime, reinterpret_cast<uint64_t>(rawValue));
        }

        template<typename T>
        T Bugra<T>::fromValue(jsi::Value& rawValue) {
            return reinterpret_cast<T>(rawValue.asBigInt(*jsRuntime).asUint64(*jsRuntime));
        }

        template<> inline jsi::Value Bugra<bool>::toValue(bool rawValue) {
            return jsi::Value(rawValue);
        }
        template<> inline bool Bugra<bool>::fromValue(jsi::Value& rawValue) {
            return rawValue.asBool();
        }

        template<> inline jsi::Value Bugra<double>::toValue(double rawValue) {
            return jsi::Value(rawValue);
        }
        template<> inline double Bugra<double>::fromValue(jsi::Value& rawValue) {
            return rawValue.getNumber();
        }

        template<> inline jsi::Value Bugra<int32_t>::toValue(int32_t rawValue) {
            return jsi::Value(rawValue);
        }
        template<> inline jsi::Value Bugra<uint32_t>::toValue(uint32_t rawValue) {
            return jsi::BigInt::fromUint64(*jsRuntime, rawValue);
        }

        template<> inline jsi::Value Bugra<int64_t>::toValue(int64_t rawValue) {
            return jsi::BigInt::fromInt64(*jsRuntime, rawValue);
        }
        template<> inline int64_t Bugra<int64_t>::fromValue(jsi::Value& rawValue) {
            return rawValue.getBigInt(*jsRuntime).asInt64(*jsRuntime);
        }

        template<> inline jsi::Value Bugra<uint64_t>::toValue(uint64_t rawValue) {
            return jsi::BigInt::fromUint64(*jsRuntime, rawValue);
        }
        template<> inline uint64_t Bugra<uint64_t>::fromValue(jsi::Value& rawValue) {
            return rawValue.getBigInt(*jsRuntime).asUint64(*jsRuntime);
        }

        template<> inline jsi::Value Bugra<std::string>::toValue(std::string rawValue) {
            return jsi::String::createFromUtf8(*jsRuntime, rawValue);
        }
        template<> inline jsi::Value Bugra<const char*>::toValue(const char* rawValue) {
            return jsi::String::createFromUtf8(*jsRuntime, std::string(rawValue));
        }

        template<> inline jsi::Value Bugra<TYPEID>::toValue(TYPEID rawValue) {
            return jsi::BigInt::fromUint64(*jsRuntime, reinterpret_cast<uint64_t>(rawValue));
        }
        template<> inline jsi::Array Bugra<TYPEID>::toArrayValue(std::vector<TYPEID> rawValue) {
            std::vector<jsi::Value> input;
            for (TYPEID t : rawValue) {
                input.push_back(Bugra<TYPEID>::toValue(t));
            }

            jsi::Array result(*jsRuntime, input.size());
            size_t index = 0;
            for (const auto& element : input) {
                result.setValueAtIndex(*jsRuntime, index++, element);
            }
            return result;
        }

        template<> inline jsi::Value Bugra<GenericFunction>::toValue(GenericFunction rawValue) {
            return jsi::BigInt::fromUint64(*jsRuntime, reinterpret_cast<uint64_t>(rawValue));
        }

        template<> inline jsi::Value Bugra<EM_VAL>::toValue(EM_VAL rawValue) {
            return jsi::BigInt::fromUint64(*jsRuntime, reinterpret_cast<uint64_t>(rawValue));
        }

        template<> inline EM_VAL Bugra<EM_VAL>::fromValue(jsi::Value& rawValue) {
            return reinterpret_cast<EM_VAL>(rawValue.asBigInt(*jsRuntime).asUint64(*jsRuntime));
            // return reinterpret_cast<EM_VAL>((uint32_t) rawValue.getNumber());
        }

        template<> inline jsi::Value Bugra<EM_METHOD_CALLER>::toValue(EM_METHOD_CALLER rawValue) {
            return jsi::BigInt::fromUint64(*jsRuntime, reinterpret_cast<uint64_t>(rawValue));
        }

        template<> inline jsi::Value Bugra<EM_DESTRUCTORS>::toValue(EM_DESTRUCTORS rawValue) {
            return jsi::BigInt::fromUint64(*jsRuntime, reinterpret_cast<uint64_t>(rawValue));
        }

        template<> inline jsi::Value Bugra<EM_DESTRUCTORS*>::toValue(EM_DESTRUCTORS* rawValue) {
            return jsi::BigInt::fromUint64(*jsRuntime, reinterpret_cast<uint64_t>(rawValue));
        }



        void _emval_register_symbol(const char* value) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_register_symbol").call(
                    *jsRuntime,
                    Bugra<const char*>::toValue(value)
            );
        }

        void _emval_incref(EM_VAL value) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_incref").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(value)
            );
        }
        void _emval_decref(EM_VAL value) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_decref").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(value)
            );
        }
        void _emval_run_destructors(EM_DESTRUCTORS handle) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_run_destructors").call(
                    *jsRuntime,
                    Bugra<EM_DESTRUCTORS>::toValue(handle)
            );
        }
        EM_VAL _emval_new_array() {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_new_array").call(
                    *jsRuntime
            );
            return Bugra<EM_VAL>::fromValue(response);
        }
        EM_VAL _emval_new_array_from_memory_view(EM_VAL mv) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_new_array_from_memory_view").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(mv)
            );
            return Bugra<EM_VAL>::fromValue(response);
        }
        EM_VAL _emval_new_object() {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_new_object").call(
                    *jsRuntime
            );
            return Bugra<EM_VAL>::fromValue(response);
        }
        EM_VAL _emval_new_cstring(const char* value) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_new_cstring").call(
                    *jsRuntime,
                    Bugra<const char*>::toValue(value)
            );
            return Bugra<EM_VAL>::fromValue(response);
        }
        EM_VAL _emval_new_u8string(const char* value) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_new_u8string").call(
                    *jsRuntime,
                    Bugra<const char*>::toValue(value)
            );
            return Bugra<EM_VAL>::fromValue(response);
        }
        // EM_VAL _emval_new_u16string(const char16_t*) {}
        EM_VAL _emval_take_value(TYPEID type, EM_VAR_ARGS argv) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_take_value").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(type),
                    Bugra<EM_VAR_ARGS>::toValue(argv)
            );
            return Bugra<EM_VAL>::fromValue(response);
        }
        EM_VAL _emval_new(EM_VAL value, unsigned argCount, const TYPEID argTypes[], EM_VAR_ARGS argv) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_new").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(value),
                    Bugra<unsigned>::toValue(argCount),
                    Bugra<TYPEID>::toArrayValue(std::vector<TYPEID>(argTypes, argTypes + argCount)),
                    Bugra<EM_VAR_ARGS>::toValue(argv)
            );
            return Bugra<EM_VAL>::fromValue(response);
        }
        EM_VAL _emval_get_global(const char* name) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_get_global").call(
                    *jsRuntime,
                    Bugra<const char*>::toValue(name)
            );
            return Bugra<EM_VAL>::fromValue(response);
        }
        EM_VAL _emval_get_module_property(const char* name) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_get_module_property").call(
                    *jsRuntime,
                    Bugra<const char*>::toValue(name)
            );
            return Bugra<EM_VAL>::fromValue(response);
        }
        EM_VAL _emval_get_property(EM_VAL object, EM_VAL key) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_get_property").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(object),
                    Bugra<EM_VAL>::toValue(key)
            );
            return Bugra<EM_VAL>::fromValue(response);
        }
        void _emval_set_property(EM_VAL object, EM_VAL key, EM_VAL value) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_set_property").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(object),
                    Bugra<EM_VAL>::toValue(key),
                    Bugra<EM_VAL>::toValue(value)
            );
        }
        EM_GENERIC_WIRE_TYPE _emval_as(EM_VAL value, TYPEID returnType, EM_DESTRUCTORS* destructors) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_as").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(value),
                    Bugra<TYPEID>::toValue(returnType),
                    Bugra<EM_DESTRUCTORS*>::toValue(destructors)
            );
            return response;
        }
        int64_t _emval_as_int64(EM_VAL value, TYPEID returnType) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_as_int64").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(value),
                    Bugra<TYPEID>::toValue(returnType)
            );
            return Bugra<int64_t>::fromValue(response);
        }
        uint64_t _emval_as_uint64(EM_VAL value, TYPEID returnType) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_as_uint64").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(value),
                    Bugra<TYPEID>::toValue(returnType)
            );
            return Bugra<uint64_t>::fromValue(response);
        }
        bool _emval_equals(EM_VAL first, EM_VAL second) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_equals").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(first),
                    Bugra<EM_VAL>::toValue(second)
            );
            return Bugra<bool>::fromValue(response);
        }
        bool _emval_strictly_equals(EM_VAL first, EM_VAL second) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_strictly_equals").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(first),
                    Bugra<EM_VAL>::toValue(second)
            );
            return Bugra<bool>::fromValue(response);
        }
        bool _emval_greater_than(EM_VAL first, EM_VAL second) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_greater_than").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(first),
                    Bugra<EM_VAL>::toValue(second)
            );
            return Bugra<bool>::fromValue(response);
        }
        bool _emval_less_than(EM_VAL first, EM_VAL second) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_less_than").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(first),
                    Bugra<EM_VAL>::toValue(second)
            );
            return Bugra<bool>::fromValue(response);
        }
        bool _emval_not(EM_VAL object) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_not").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(object)
            );
            return Bugra<bool>::fromValue(response);
        }
        EM_VAL _emval_call(EM_VAL value, unsigned argCount, const TYPEID argTypes[], EM_VAR_ARGS argv) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_call").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(value),
                    Bugra<unsigned>::toValue(argCount),
                    Bugra<TYPEID>::toArrayValue(std::vector<TYPEID>(argTypes, argTypes + argCount)),
                    Bugra<EM_VAR_ARGS>::toValue(argv)
            );
            return Bugra<EM_VAL>::fromValue(response);
        }
        EM_METHOD_CALLER _emval_get_method_caller(unsigned argCount, const TYPEID argTypes[]) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_get_method_caller").call(
                    *jsRuntime,
                    Bugra<unsigned>::toValue(argCount),
                    Bugra<TYPEID>::toArrayValue(std::vector<TYPEID>(argTypes, argTypes + argCount))
            );
            return Bugra<EM_METHOD_CALLER>::fromValue(response);
        }
        EM_GENERIC_WIRE_TYPE _emval_call_method(EM_METHOD_CALLER caller, EM_VAL handle, const char* methodName, EM_DESTRUCTORS* destructors, EM_VAR_ARGS argv) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_call_method").call(
                    *jsRuntime,
                    Bugra<EM_METHOD_CALLER>::toValue(caller),
                    Bugra<EM_VAL>::toValue(handle),
                    Bugra<const char*>::toValue(methodName),
                    Bugra<EM_DESTRUCTORS*>::toValue(destructors),
                    Bugra<EM_VAR_ARGS>::toValue(argv)
            );
            return response;
        }
        void _emval_call_void_method(EM_METHOD_CALLER caller, EM_VAL handle, const char* methodName, EM_VAR_ARGS argv) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_call_void_method").call(
                    *jsRuntime,
                    Bugra<EM_METHOD_CALLER>::toValue(caller),
                    Bugra<EM_VAL>::toValue(handle),
                    Bugra<const char*>::toValue(methodName),
                    Bugra<EM_VAR_ARGS>::toValue(argv)
            );
        }
        EM_VAL _emval_typeof(EM_VAL value) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_typeof").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(value)
            );
            return Bugra<EM_VAL>::fromValue(response);
        }
        bool _emval_instanceof(EM_VAL object, EM_VAL constructor) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_instanceof").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(object),
                    Bugra<EM_VAL>::toValue(constructor)
            );
            return Bugra<bool>::fromValue(response);
        }
        bool _emval_is_number(EM_VAL object) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_is_number").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(object)
            );
            return Bugra<bool>::fromValue(response);
        }
        bool _emval_is_string(EM_VAL object) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_is_string").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(object)
            );
            return Bugra<bool>::fromValue(response);
        }
        bool _emval_in(EM_VAL item, EM_VAL object) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_in").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(item),
                    Bugra<EM_VAL>::toValue(object)
            );
            return Bugra<bool>::fromValue(response);
        }
        bool _emval_delete(EM_VAL object, EM_VAL property) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_delete").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(object),
                    Bugra<EM_VAL>::toValue(property)
            );
            return Bugra<bool>::fromValue(response);
        }
        bool _emval_throw(EM_VAL object) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__emval_throw").call(
                    *jsRuntime,
                    Bugra<EM_VAL>::toValue(object)
            );
        }


        void _embind_register_void(TYPEID voidType, const char *name) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_void").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(voidType),
                    Bugra<const char*>::toValue(name)
                    );
        }

        void _embind_register_jsiValue(TYPEID jsiValueType, const char *name) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_jsiValue").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(jsiValueType),
                    Bugra<const char*>::toValue(name)
            );
        }

        void _embind_register_bool(TYPEID boolType, const char *name, size_t size, bool trueValue,
                                   bool falseValue) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_bool").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(boolType),
                    Bugra<const char*>::toValue(name),
                    Bugra<int32_t>::toValue((int32_t) size),
                    Bugra<bool>::toValue(trueValue),
                    Bugra<bool>::toValue(falseValue)
            );
        }

        /* template <typename... Things>
        void printVariadic(Things... things) {
            for(const auto p : {things...}) {
                uint64_t a = reinterpret_cast<uint64_t>(&p.type());
                int z = std::any_cast<int>(p);
                int r = 2;

            }
        } */

        void _embind_register_integer(TYPEID integerType, const char *name, size_t size,
                                      int32_t minRange, uint32_t maxRange) {
            // uint64_t z = reinterpret_cast<uint64_t>(integerType);
            // printVariadic(std::any(integerType), std::any(name), std::any(size), std::any(minRange), std::any(maxRange));
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_integer").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(integerType),
                    Bugra<const char*>::toValue(name),
                    Bugra<int32_t>::toValue((int32_t) size),
                    Bugra<int32_t>::toValue(minRange),
                    Bugra<uint32_t>::toValue(maxRange)
                    );
        }

        void
        _embind_register_bigint(TYPEID integerType, const char *name, size_t size, int64_t minRange,
                                uint64_t maxRange) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_bigint").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(integerType),
                    Bugra<const char*>::toValue(name),
                    Bugra<uint64_t>::toValue((uint64_t) size),
                    Bugra<int64_t>::toValue(minRange),
                    Bugra<uint64_t>::toValue(maxRange)
                    );
        }

        void _embind_register_float(TYPEID floatType, const char *name, size_t size) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_float").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(floatType),
                    Bugra<const char*>::toValue(name),
                    Bugra<int32_t>::toValue((int32_t) size)
                    );
        }

        void _embind_register_std_string(TYPEID stringType, const char *name) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_std_string").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(stringType),
                    Bugra<const char*>::toValue(name)
                    );
        }

        void _embind_register_std_wstring(TYPEID stringType, size_t charSize, const char *name) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_std_wstring").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(stringType),
                    Bugra<int32_t>::toValue((int32_t) charSize),
                    Bugra<const char*>::toValue(name)
                    );
        }

        void _embind_register_emval(TYPEID emvalType, const char *name) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_emval").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(emvalType),
                    Bugra<const char*>::toValue(name)
                    );
        }

        void _embind_register_memory_view(TYPEID memoryViewType, unsigned int typedArrayIndex,
                                          const char *name) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_memory_view").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(memoryViewType),
                    Bugra<uint32_t>::toValue(typedArrayIndex),
                    Bugra<const char*>::toValue(name)
                    );
        }

        void _embind_register_function(
                const char *name,
                unsigned argCount,
                const TYPEID argTypes[],
                const char *signature,
                facebook::jsi::Function& invoker,
                GenericFunction function,
                bool isAsync) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_function").call(
                    *jsRuntime,
                    Bugra<const char*>::toValue(name),
                    Bugra<int32_t>::toValue(argCount),
                    Bugra<TYPEID>::toArrayValue(std::vector<TYPEID>(argTypes, argTypes + argCount)),
                    Bugra<const char*>::toValue(signature),
                    invoker,
                    Bugra<GenericFunction>::toValue(function),
                    Bugra<bool>::toValue(isAsync)
                    );
        }

        void _embind_register_value_array(
                TYPEID tupleType,
                const char *name,
                const char *constructorSignature,
                facebook::jsi::Function& constructor,
                const char *destructorSignature,
                facebook::jsi::Function& destructor) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_value_array").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(tupleType),
                    Bugra<const char*>::toValue(name),
                    Bugra<const char*>::toValue(constructorSignature),
                    constructor,
                    Bugra<const char*>::toValue(destructorSignature),
                    destructor
                    );
        }

        void _embind_register_value_array_element(
                TYPEID tupleType,
                TYPEID getterReturnType,
                const char *getterSignature,
                facebook::jsi::Function& getter,
                void *getterContext,
                TYPEID setterArgumentType,
                const char *setterSignature,
                facebook::jsi::Function& setter,
                void *setterContext) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_value_array_element").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(tupleType),
                    Bugra<TYPEID>::toValue(getterReturnType),
                    Bugra<const char*>::toValue(getterSignature),
                    getter,
                    Bugra<GenericFunction>::toValue(getterContext),
                    Bugra<TYPEID>::toValue(setterArgumentType),
                    Bugra<const char*>::toValue(setterSignature),
                    setter,
                    Bugra<GenericFunction>::toValue(setterContext)
                    );
        }

        void _embind_finalize_value_array(TYPEID tupleType) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_finalize_value_array").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(tupleType)
                    );
        }

        void _embind_register_value_object(
                TYPEID structType,
                const char *fieldName,
                const char *constructorSignature,
                facebook::jsi::Function& constructor,
                const char *destructorSignature,
                facebook::jsi::Function& destructor) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_value_object").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(structType),
                    Bugra<const char*>::toValue(fieldName),
                    Bugra<const char*>::toValue(constructorSignature),
                    constructor,
                    Bugra<const char*>::toValue(destructorSignature),
                    destructor
                    );
        }

        void _embind_register_value_object_field(
                TYPEID structType,
                const char *fieldName,
                TYPEID getterReturnType,
                const char *getterSignature,
                facebook::jsi::Function& getter,
                void *getterContext,
                TYPEID setterArgumentType,
                const char *setterSignature,
                facebook::jsi::Function& setter,
                void *setterContext) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_value_object_field").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(structType),
                    Bugra<const char*>::toValue(fieldName),
                    Bugra<TYPEID>::toValue(getterReturnType),
                    Bugra<const char*>::toValue(getterSignature),
                    getter,
                    Bugra<GenericFunction>::toValue(getterContext),
                    Bugra<TYPEID>::toValue(setterArgumentType),
                    Bugra<const char*>::toValue(setterSignature),
                    setter,
                    Bugra<GenericFunction>::toValue(setterContext)
                    );
        }

        void _embind_finalize_value_object(TYPEID structType) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_finalize_value_object").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(structType)
                    );
        }

        void _embind_register_class(
                TYPEID classType,
                TYPEID pointerType,
                TYPEID constPointerType,
                TYPEID baseClassType,
                const char *getActualTypeSignature,
                facebook::jsi::Function& getActualType,
                const char *upcastSignature,
                facebook::jsi::Function& upcast,
                const char *downcastSignature,
                facebook::jsi::Function& downcast,
                const char *className,
                const char *destructorSignature,
                facebook::jsi::Function& destructor) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_class").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(classType),
                    Bugra<TYPEID>::toValue(pointerType),
                    Bugra<TYPEID>::toValue(constPointerType),
                    Bugra<TYPEID>::toValue(baseClassType),
                    Bugra<const char*>::toValue(getActualTypeSignature),
                    getActualType,
                    Bugra<const char*>::toValue(upcastSignature),
                    upcast,
                    Bugra<const char*>::toValue(downcastSignature),
                    downcast,
                    Bugra<const char*>::toValue(className),
                    Bugra<const char*>::toValue(destructorSignature),
                    destructor
                    );
        }

        void _embind_register_class_constructor(
                TYPEID classType,
                unsigned argCount,
                const TYPEID argTypes[],
                const char *invokerSignature,
                facebook::jsi::Function& invoker,
                GenericFunction constructor) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_class_constructor").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(classType),
                    Bugra<int32_t>::toValue(argCount),
                    Bugra<TYPEID>::toArrayValue(std::vector<TYPEID>(argTypes, argTypes + argCount)),
                    Bugra<const char*>::toValue(invokerSignature),
                    invoker,
                    Bugra<GenericFunction>::toValue(constructor)
                    );
        }

        void _embind_register_class_function(
                TYPEID classType,
                const char *methodName,
                unsigned argCount,
                const TYPEID argTypes[],
                const char *invokerSignature,
                facebook::jsi::Function& invoker,
                void *context,
                unsigned isPureVirtual,
                bool isAsync) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_class_function").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(classType),
                    Bugra<const char*>::toValue(methodName),
                    Bugra<int32_t>::toValue(argCount),
                    Bugra<TYPEID>::toArrayValue(std::vector<TYPEID>(argTypes, argTypes + argCount)),
                    Bugra<const char*>::toValue(invokerSignature),
                    invoker,
                    Bugra<GenericFunction>::toValue(context),
                    Bugra<int32_t>::toValue(isPureVirtual),
                    Bugra<bool>::toValue(isAsync)
                    );
        }

        void _embind_register_class_property(
                TYPEID classType,
                const char *fieldName,
                TYPEID getterReturnType,
                const char *getterSignature,
                facebook::jsi::Function& getter,
                void *getterContext,
                TYPEID setterArgumentType,
                const char *setterSignature,
                facebook::jsi::Function& setter,
                void *setterContext) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_class_property").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(classType),
                    Bugra<const char*>::toValue(fieldName),
                    Bugra<TYPEID>::toValue(getterReturnType),
                    Bugra<const char*>::toValue(getterSignature),
                    getter,
                    Bugra<GenericFunction>::toValue(getterContext),
                    Bugra<TYPEID>::toValue(setterArgumentType),
                    Bugra<const char*>::toValue(setterSignature),
                    setter,
                    Bugra<GenericFunction>::toValue(setterContext)
                    );
        }

        void _embind_register_class_class_function(
                TYPEID classType,
                const char *methodName,
                unsigned argCount,
                const TYPEID argTypes[],
                const char *invokerSignature,
                facebook::jsi::Function& invoker,
                GenericFunction method,
                bool isAsync) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_class_class_function").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(classType),
                    Bugra<const char*>::toValue(methodName),
                    Bugra<int32_t>::toValue(argCount),
                    Bugra<TYPEID>::toArrayValue(std::vector<TYPEID>(argTypes, argTypes + argCount)),
                    Bugra<const char*>::toValue(invokerSignature),
                    invoker,
                    Bugra<GenericFunction>::toValue(method),
                    Bugra<bool>::toValue(isAsync)
                    );
        }

        void _embind_register_class_class_property(
                TYPEID classType,
                const char *fieldName,
                TYPEID fieldType,
                void *fieldContext,
                const char *getterSignature,
                facebook::jsi::Function& getter,
                const char *setterSignature,
                facebook::jsi::Function& setter) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_class_class_property").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(classType),
                    Bugra<const char*>::toValue(fieldName),
                    Bugra<TYPEID>::toValue(fieldType),
                    Bugra<GenericFunction>::toValue(fieldContext),
                    Bugra<const char*>::toValue(getterSignature),
                    getter,
                    Bugra<const char*>::toValue(setterSignature),
                    setter
                    );
        }

        EM_VAL _embind_create_inheriting_constructor(
                const char *constructorName,
                TYPEID wrapperType,
                EM_VAL properties) {
            auto response = jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_create_inheriting_constructor").call(
                    *jsRuntime,
                    Bugra<const char*>::toValue(constructorName),
                    Bugra<TYPEID>::toValue(wrapperType),
                    Bugra<EM_VAL>::toValue(properties)
                    );
            return Bugra<EM_VAL>::fromValue(response);
        }

        void _embind_register_enum(
                TYPEID enumType,
                const char *name,
                size_t size,
                bool isSigned) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_enum").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(enumType),
                    Bugra<const char*>::toValue(name),
                    Bugra<int32_t>::toValue((int32_t) size),
                    Bugra<bool>::toValue(isSigned)
                    );
        }

        void _embind_register_smart_ptr(
                TYPEID pointerType,
                TYPEID pointeeType,
                const char *pointerName,
                sharing_policy sharingPolicy,
                const char *getPointeeSignature,
                facebook::jsi::Function& getPointee,
                const char *constructorSignature,
                facebook::jsi::Function& constructor,
                const char *shareSignature,
                facebook::jsi::Function& share,
                const char *destructorSignature,
                facebook::jsi::Function& destructor) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_smart_ptr").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(pointerType),
                    Bugra<TYPEID>::toValue(pointeeType),
                    Bugra<const char*>::toValue(pointerName),
                    Bugra<uint32_t>::toValue((uint32_t) sharingPolicy),
                    Bugra<const char*>::toValue(getPointeeSignature),
                    getPointee,
                    Bugra<const char*>::toValue(constructorSignature),
                    constructor,
                    Bugra<const char*>::toValue(shareSignature),
                    share,
                    Bugra<const char*>::toValue(destructorSignature),
                    destructor);
        }

        void _embind_register_enum_value(
                TYPEID enumType,
                const char *valueName,
                GenericEnumValue value) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_enum_value").call(
                    *jsRuntime,
                    Bugra<TYPEID>::toValue(enumType),
                    Bugra<const char*>::toValue(valueName),
                    Bugra<GenericEnumValue>::toValue(value)
                    );
        }

        void _embind_register_constant(
                const char *name,
                TYPEID constantType,
                const facebook::jsi::Value value) {
            jsRuntime->global().getPropertyAsFunction(*jsRuntime, "__embind_register_constant").call(
                    *jsRuntime,
                    Bugra<const char*>::toValue(name),
                    Bugra<TYPEID>::toValue(constantType),
                    value
                    );
        }

        const char *EMSCRIPTEN_KEEPALIVE __getTypeName(const std::type_info *ti) {
            if (has_unbound_type_names) {
#ifdef USE_CXA_DEMANGLE
                int stat;
                char* demangled = abi::__cxa_demangle(ti->name(), NULL, NULL, &stat);
                if (stat == 0 && demangled) {
                  return demangled;
                }

                switch (stat) {
                  case -1:
                    return strdup("<allocation failure>");
                  case -2:
                    return strdup("<invalid C++ symbol>");
                  case -3:
                    return strdup("<invalid argument>");
                  default:
                    return strdup("<unknown error>");
                }
#else
                return strdup(ti->name());
#endif
            } else {
                char str[80];
                sprintf(str, "%p", reinterpret_cast<const void *>(ti));
                return strdup(str);
            }
        }

        static InitFunc *init_funcs = nullptr;


        struct FixedBuffer : facebook::jsi::MutableBuffer {
            FixedBuffer(uint64_t offset) : offset(offset) {}

            size_t size() const override {
                return UINT32_MAX;
            }
            uint8_t *data() override {
                return reinterpret_cast<uint8_t *>(offset);
            }

            int r = 3;
            uint64_t offset;
        };


        EMSCRIPTEN_KEEPALIVE void _embind_initialize_bindings(jsi::Runtime& rt) {
            jsRuntime = &rt;

            char* name = "M";
            uint64_t namePtrNumber = reinterpret_cast<uint64_t>(name);
            // uint64_t offset = (namePtrNumber >> 32) << 32;
            uint64_t offset = namePtrNumber - UINT32_MAX;
            auto buf = std::make_shared<FixedBuffer>(offset);
            auto arrayBuffer = facebook::jsi::ArrayBuffer(rt, buf);
            rt.global().setProperty(rt, "jsiArrayBuffer", arrayBuffer);

            uint64_t bufPtrNumber = reinterpret_cast<uint64_t>(buf.get());
            // uint64_t offset2 = (bufPtrNumber >> 32) << 32;
            uint64_t offset2 = bufPtrNumber - UINT32_MAX;
            auto buf2 = std::make_shared<FixedBuffer>(offset2);
            auto arrayBuffer2 = facebook::jsi::ArrayBuffer(rt, buf2);
            rt.global().setProperty(rt, "jsiArrayBuffer2", arrayBuffer2);

            uint64_t offset3 = offset - UINT32_MAX;
            auto buf3 = std::make_shared<FixedBuffer>(offset3);
            auto arrayBuffer3 = facebook::jsi::ArrayBuffer(rt, buf3);
            rt.global().setProperty(rt, "jsiArrayBuffer3", arrayBuffer3);

            uint64_t offset4 = namePtrNumber;
            auto buf4 = std::make_shared<FixedBuffer>(offset4);
            auto arrayBuffer4 = facebook::jsi::ArrayBuffer(rt, buf4);
            rt.global().setProperty(rt, "jsiArrayBuffer4", arrayBuffer4);

            jsRuntime->global().getPropertyAsFunction(rt, "updateMemoryViews").call(
                    *jsRuntime,
                    jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(offset)),
                    jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(offset2)),
                    jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(offset3)),
                    jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(offset4))
                    );

            for (auto *f = init_funcs; f; f = f->next) {
                f->init_func();
            }
        }

        void _embind_register_bindings(InitFunc *f) {
            f->next = init_funcs;
            init_funcs = f;
        }

    }
}

namespace {
template <typename T> static void register_integer(const char* name) {
  using namespace internal;
  _embind_register_integer(TypeID<T>::get(), name, sizeof(T), std::numeric_limits<T>::min(),
    std::numeric_limits<T>::max());
}

template <typename T> static void register_bigint(const char* name) {
  using namespace internal;
  _embind_register_bigint(TypeID<T>::get(), name, sizeof(T), std::numeric_limits<T>::min(),
    std::numeric_limits<T>::max());
}

template <typename T> static void register_float(const char* name) {
  using namespace internal;
  _embind_register_float(TypeID<T>::get(), name, sizeof(T));
}

// matches typeMapping in embind.js
enum TypedArrayIndex {
  Int8Array,
  Uint8Array,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  // Only available if WASM_BIGINT
  Int64Array,
  Uint64Array,
};

template <typename T> constexpr TypedArrayIndex getTypedArrayIndex() {
  static_assert(internal::typeSupportsMemoryView<T>(), "type does not map to a typed array");
  return std::is_floating_point<T>::value
           ? (sizeof(T) == 4 ? Float32Array : Float64Array)
           : (sizeof(T) == 1
                 ? (std::is_signed<T>::value ? Int8Array : Uint8Array)
                 : (sizeof(T) == 2 ? (std::is_signed<T>::value ? Int16Array : Uint16Array)
                                   : (sizeof(T) == 4 ? (std::is_signed<T>::value ? Int32Array : Uint32Array)
                                                     : (std::is_signed<T>::value ? Int64Array : Uint64Array))));
}

template <typename T> static void register_memory_view(const char* name) {
  using namespace internal;
  _embind_register_memory_view(TypeID<memory_view<T>>::get(), getTypedArrayIndex<T>(), name);
}
} // namespace


EMSCRIPTEN_BINDINGS(builtin) {
  using namespace emscripten::internal;

  _embind_register_void(TypeID<void>::get(), "void");
  _embind_register_jsiValue(TypeID<facebook::jsi::Value>::get(), "jsiValue");

  _embind_register_bool(TypeID<bool>::get(), "bool", sizeof(bool), true, false);

  register_integer<char>("char");
  register_integer<signed char>("signed char");
  register_integer<unsigned char>("unsigned char");
  register_integer<signed short>("short");
  register_integer<unsigned short>("unsigned short");
  register_integer<signed int>("int");
  register_integer<unsigned int>("unsigned int");

  // register_bigint<signed long>("long");
  // register_bigint<unsigned long>("unsigned long");

  register_bigint<int64_t>("int64_t");
  register_bigint<uint64_t>("uint64_t");

  register_float<float>("float");
  register_float<double>("double");

  _embind_register_std_string(TypeID<std::string>::get(), "std::string");
  _embind_register_std_string(
    TypeID<std::basic_string<unsigned char>>::get(), "std::basic_string<unsigned char>");
  _embind_register_std_wstring(TypeID<std::wstring>::get(), sizeof(wchar_t), "std::wstring");
  _embind_register_std_wstring(TypeID<std::u16string>::get(), sizeof(char16_t), "std::u16string");
  _embind_register_std_wstring(TypeID<std::u32string>::get(), sizeof(char32_t), "std::u32string");
  _embind_register_emval(TypeID<val>::get(), "emscripten::val");

  // Some of these types are aliases for each other. Luckily,
  // embind.js's _embind_register_memory_view ignores duplicate
  // registrations rather than asserting, so the first
  // register_memory_view call for a particular type will take
  // precedence.

  register_memory_view<char>("emscripten::memory_view<char>");
  register_memory_view<signed char>("emscripten::memory_view<signed char>");
  register_memory_view<unsigned char>("emscripten::memory_view<unsigned char>");

  register_memory_view<short>("emscripten::memory_view<short>");
  register_memory_view<unsigned short>("emscripten::memory_view<unsigned short>");
  register_memory_view<int>("emscripten::memory_view<int>");
  register_memory_view<unsigned int>("emscripten::memory_view<unsigned int>");
  register_memory_view<long>("emscripten::memory_view<long>");
  register_memory_view<unsigned long>("emscripten::memory_view<unsigned long>");

  register_memory_view<int8_t>("emscripten::memory_view<int8_t>");
  register_memory_view<uint8_t>("emscripten::memory_view<uint8_t>");
  register_memory_view<int16_t>("emscripten::memory_view<int16_t>");
  register_memory_view<uint16_t>("emscripten::memory_view<uint16_t>");
  register_memory_view<int32_t>("emscripten::memory_view<int32_t>");
  register_memory_view<uint32_t>("emscripten::memory_view<uint32_t>");
  register_memory_view<int64_t>("emscripten::memory_view<int64_t>");
  register_memory_view<uint64_t>("emscripten::memory_view<uint64_t>");

  register_memory_view<float>("emscripten::memory_view<float>");
  register_memory_view<double>("emscripten::memory_view<double>");

    // register_vector<bool>("BoolVector");
    register_vector<char>("CharVector");
    register_vector<short>("ShortVector");
    register_vector<int>("IntVector");
    register_vector<int64_t>("Int64_tVector");
    register_vector<float>("FloatVector");
    register_vector<double>("DoubleVector");
    register_vector<std::string>("StringVector");
}
