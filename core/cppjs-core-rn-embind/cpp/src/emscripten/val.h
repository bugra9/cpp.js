/*
 * Copyright 2012 The Emscripten Authors.  All rights reserved.
 * Emscripten is available under two separate licenses, the MIT license and the
 * University of Illinois/NCSA Open Source License.  Both these licenses can be
 * found in the LICENSE file.
 */

#pragma once

#if __cplusplus < 201103L
#error Including <./val.h> requires building with -std=c++11 or newer!
#endif

#include <cassert>
#include <array>
#include <climits>
#include "./wire.h"
#include <cstdint> // uintptr_t
#include <vector>

// #include <android/log.h>
// #define APPNAME "react-native-cppjs"

namespace emscripten {
    extern facebook::jsi::Runtime* jsRuntime;

class val;

typedef struct _EM_VAL* EM_VAL;

namespace internal {

template<typename WrapperType>
val wrapped_extend(const std::string&, const val&);

// Implemented in JavaScript.  Don't call these directly.
extern "C" {

void _emval_register_symbol(const char*);

enum {
  _EMVAL_UNDEFINED = 1,
  _EMVAL_NULL = 2,
  _EMVAL_TRUE = 3,
  _EMVAL_FALSE = 4
};

typedef struct _EM_DESTRUCTORS* EM_DESTRUCTORS;
typedef struct _EM_METHOD_CALLER* EM_METHOD_CALLER;
typedef facebook::jsi::Value EM_GENERIC_WIRE_TYPE;
typedef const void* EM_VAR_ARGS;

void _emval_incref(EM_VAL value);
void _emval_decref(EM_VAL value);

void _emval_run_destructors(EM_DESTRUCTORS handle);

EM_VAL _emval_new_array();
EM_VAL _emval_new_array_from_memory_view(EM_VAL mv);
EM_VAL _emval_new_object();
EM_VAL _emval_new_cstring(const char*);
EM_VAL _emval_new_u8string(const char*);
EM_VAL _emval_new_u16string(const char16_t*);

EM_VAL _emval_take_value(TYPEID type, EM_VAR_ARGS argv);

EM_VAL _emval_new(
    EM_VAL value,
    unsigned argCount,
    const TYPEID argTypes[],
    EM_VAR_ARGS argv);

EM_VAL _emval_get_global(const char* name);
EM_VAL _emval_get_module_property(const char* name);
EM_VAL _emval_get_property(EM_VAL object, EM_VAL key);
void _emval_set_property(EM_VAL object, EM_VAL key, EM_VAL value);
EM_GENERIC_WIRE_TYPE _emval_as(EM_VAL value, TYPEID returnType, EM_DESTRUCTORS* destructors);
int64_t _emval_as_int64(EM_VAL value, TYPEID returnType);
uint64_t _emval_as_uint64(EM_VAL value, TYPEID returnType);

bool _emval_equals(EM_VAL first, EM_VAL second);
bool _emval_strictly_equals(EM_VAL first, EM_VAL second);
bool _emval_greater_than(EM_VAL first, EM_VAL second);
bool _emval_less_than(EM_VAL first, EM_VAL second);
bool _emval_not(EM_VAL object);

EM_VAL _emval_call(
    EM_VAL value,
    unsigned argCount,
    const TYPEID argTypes[],
    EM_VAR_ARGS argv);

// DO NOT call this more than once per signature. It will
// leak generated function objects!
EM_METHOD_CALLER _emval_get_method_caller(
    unsigned argCount, // including return value
    const TYPEID argTypes[]);
EM_GENERIC_WIRE_TYPE _emval_call_method(
    EM_METHOD_CALLER caller,
    EM_VAL handle,
    const char* methodName,
    EM_DESTRUCTORS* destructors,
    EM_VAR_ARGS argv);
void _emval_call_void_method(
    EM_METHOD_CALLER caller,
    EM_VAL handle,
    const char* methodName,
    EM_VAR_ARGS argv);
EM_VAL _emval_typeof(EM_VAL value);
bool _emval_instanceof(EM_VAL object, EM_VAL constructor);
bool _emval_is_number(EM_VAL object);
bool _emval_is_string(EM_VAL object);
bool _emval_in(EM_VAL item, EM_VAL object);
bool _emval_delete(EM_VAL object, EM_VAL property);
[[noreturn]] bool _emval_throw(EM_VAL object);
EM_VAL _emval_await(EM_VAL promise);

} // extern "C"

template<const char* address>
struct symbol_registrar {
  symbol_registrar() {
    internal::_emval_register_symbol(address);
  }
};

template<typename ReturnType, typename... Args>
struct Signature {
  /*
  typedef typename BindingType<ReturnType>::WireType (*MethodCaller)(
      EM_VAL value,
      const char* methodName,
      EM_DESTRUCTORS* destructors,
      typename BindingType<Args>::WireType...);
  */

  static EM_METHOD_CALLER get_method_caller() {
    constexpr WithPolicies<>::ArgTypeList<ReturnType, Args...> args;
    thread_local EM_METHOD_CALLER mc = _emval_get_method_caller(args.getCount(), args.getTypes());
    return mc;
  }
};

struct DestructorsRunner {
public:
  explicit DestructorsRunner(EM_DESTRUCTORS d)
      : destructors(d)
  {}
  ~DestructorsRunner() {
    _emval_run_destructors(destructors);
  }

  DestructorsRunner(const DestructorsRunner&) = delete;
  void operator=(const DestructorsRunner&) = delete;

private:
  EM_DESTRUCTORS destructors;
};

template<typename WireType>
struct GenericWireTypeConverter {
  static WireType from(facebook::jsi::Value& wt) {
    return BindingType<WireType>::fromWireType2(*jsRuntime, wt);
  }
};

template<typename Pointee>
struct GenericWireTypeConverter<Pointee*> {
  static Pointee* from(facebook::jsi::Value& wt) {
    return reinterpret_cast<Pointee*>(wt.asBigInt(*jsRuntime).asUint64(*jsRuntime));
  }
};

template<typename T>
T fromGenericWireType(facebook::jsi::Value& g) {
    if constexpr (std::is_same<T, std::string>::value) {
        return g.getString(*jsRuntime).utf8(*jsRuntime);
    }
  typedef typename BindingType<T>::WireType WireType;
  WireType wt = GenericWireTypeConverter<WireType>::from(g);
  return BindingType<T>::fromWireType(wt);
}

template<typename... Args>
struct PackSize;

template<>
struct PackSize<> {
  static constexpr size_t value = 0;
};

template<typename Arg, typename... Args>
struct PackSize<Arg, Args...> {
  static constexpr size_t value = (sizeof(typename BindingType<Arg>::WireType) + 7) / 8 + PackSize<Args...>::value;
};

union GenericWireType {
  union {
    unsigned u;
    float f;
    // Use uint32_t for pointer values.  This limits us, for now, to 32-bit
    // address ranges even on wasm64.  This is enforced by assertions below.
    // TODO(sbc): Allow full 64-bit address range here under wasm64, most
    // likely by increasing the size of GenericWireType on wasm64.
    uint32_t p;
  } w[2];
    double d;
    uint64_t u;
};
static_assert(sizeof(GenericWireType) == 8, "GenericWireType must be 8 bytes");
static_assert(alignof(GenericWireType) == 8, "GenericWireType must be 8-byte-aligned");

inline void writeGenericWireType(GenericWireType*& cursor, float wt) {
  cursor->w[0].f = wt;
  ++cursor;
}

inline void writeGenericWireType(GenericWireType*& cursor, double wt) {
  cursor->d = wt;
  ++cursor;
}

inline void writeGenericWireType(GenericWireType*& cursor, int64_t wt) {
  cursor->u = wt;
  ++cursor;
}

inline void writeGenericWireType(GenericWireType*& cursor, uint64_t wt) {
  cursor->u = wt;
  ++cursor;
}

template<typename T>
void writeGenericWireType(GenericWireType*& cursor, T* wt) {
  uint64_t short_ptr = reinterpret_cast<uint64_t>(wt);
  // assert(short_ptr <= UINT32_MAX);
  cursor->u = short_ptr;
  ++cursor;
}

template<typename ElementType>
inline void writeGenericWireType(GenericWireType*& cursor, const memory_view<ElementType>& wt) {
  uintptr_t short_ptr = reinterpret_cast<uintptr_t>(wt.data);
  assert(short_ptr <= UINT32_MAX);
  cursor->w[0].u = wt.size;
  cursor->w[1].p = short_ptr;
  ++cursor;
}

template<typename T>
void writeGenericWireType(GenericWireType*& cursor, T wt) {
  cursor->w[0].u = static_cast<unsigned>(wt);
  ++cursor;
}

inline void writeGenericWireTypes(GenericWireType*&) {
}

template<typename First, typename... Rest>
EMSCRIPTEN_ALWAYS_INLINE void writeGenericWireTypes(GenericWireType*& cursor, First&& first, Rest&&... rest) {
  writeGenericWireType(cursor, BindingType<First>::toWireType(std::forward<First>(first)));
  writeGenericWireTypes(cursor, std::forward<Rest>(rest)...);
}

template<typename... Args>
struct WireTypePack {
  WireTypePack(Args&&... args) {
    GenericWireType* cursor = elements.data();
    writeGenericWireTypes(cursor, std::forward<Args>(args)...);
  }

  operator EM_VAR_ARGS() const {
    return elements.data();
  }

private:
  std::array<GenericWireType, PackSize<Args...>::value> elements;
};

template<typename ReturnType, typename... Args>
struct MethodCaller {
  static ReturnType call(EM_VAL handle, const char* methodName, Args&&... args) {
    auto caller = Signature<ReturnType, Args...>::get_method_caller();

    WireTypePack<Args...> argv(std::forward<Args>(args)...);
    EM_DESTRUCTORS destructors;
    EM_GENERIC_WIRE_TYPE result = _emval_call_method(
      caller,
      handle,
      methodName,
      &destructors,
      argv);
    DestructorsRunner rd(destructors);
    return fromGenericWireType<ReturnType>(result);
  }
};

template<typename... Args>
struct MethodCaller<void, Args...> {
  static void call(EM_VAL handle, const char* methodName, Args&&... args) {
    auto caller = Signature<void, Args...>::get_method_caller();

    WireTypePack<Args...> argv(std::forward<Args>(args)...);
    _emval_call_void_method(
      caller,
      handle,
      methodName,
      argv);
  }
};

} // end namespace internal

#define EMSCRIPTEN_SYMBOL(name)                                         \
static const char name##_symbol[] = #name;                          \
static const ::emscripten::internal::symbol_registrar<name##_symbol> name##_registrar

class val {
public:
  // missing operators:
  // * ~ - + ++ --
  // * * / %
  // * + -
  // * << >> >>>
  // * & ^ | && || ?:
  //
  // exposing void, comma, and conditional is unnecessary
  // same with: = += -= *= /= %= <<= >>= >>>= &= ^= |=

  static val array() {
    return val(internal::_emval_new_array());
  }

  template<typename Iter>
  static val array(Iter begin, Iter end) {
#if _LIBCPP_STD_VER >= 20
    if constexpr (std::contiguous_iterator<Iter> &&
                  internal::typeSupportsMemoryView<
                    typename std::iterator_traits<Iter>::value_type>()) {
      val view{ typed_memory_view(std::distance(begin, end), std::to_address(begin)) };
      return val(internal::_emval_new_array_from_memory_view(view.as_handle()));
    }
    // For numeric arrays, following codes are unreachable and the compiler
    // will do 'dead code elimination'.
    // Others fallback old way.
#endif
    val new_array = array();
    for (auto it = begin; it != end; ++it) {
      new_array.call<void>("push", *it);
    }
    return new_array;
  }

  template<typename T>
  static val array(const std::vector<T>& vec) {
    if constexpr (internal::typeSupportsMemoryView<T>()) {
        // for numeric types, pass memory view and copy in JS side one-off
        val view{ typed_memory_view(vec.size(), vec.data()) };
        return val(internal::_emval_new_array_from_memory_view(view.as_handle()));
    } else {
        return array(vec.begin(), vec.end());
    }
  }

  static val object() {
    return val(internal::_emval_new_object());
  }

  static val u8string(const char* s) {
    return val(internal::_emval_new_u8string(s));
  }

  static val u16string(const char16_t* s) {
    return val(internal::_emval_new_u16string(s));
  }

  static val undefined() {
    return val(EM_VAL(internal::_EMVAL_UNDEFINED));
  }

  static val null() {
    return val(EM_VAL(internal::_EMVAL_NULL));
  }

  static val take_ownership(EM_VAL e) {
    return val(e);
  }

  static val global(const char* name = "") {
    return val(internal::_emval_get_global(name));
  }

  static val module_property(const char* name) {
    return val(internal::_emval_get_module_property(name));
  }

  template<typename T>
  explicit val(T&& value) {
    using namespace internal;

    typedef internal::BindingType<T> BT;
    WireTypePack<T> argv(std::forward<T>(value));
    handle = _emval_take_value(internal::TypeID<T>::get(), argv);
  }

  val() : handle(EM_VAL(internal::_EMVAL_UNDEFINED)) {}

  explicit val(const char* v)
      : handle(internal::_emval_new_cstring(v))
  {}

  val(val&& v) : handle(v.handle) {
    v.handle = 0;
  }

  val(const val& v) : handle(v.handle) {
    internal::_emval_incref(handle);
  }

  ~val() {
    internal::_emval_decref(handle);
  }

  EM_VAL as_handle() const {
    return handle;
  }

  val& operator=(val&& v) & {
    internal::_emval_decref(handle);
    handle = v.handle;
    v.handle = 0;
    return *this;
  }

  val& operator=(const val& v) & {
    internal::_emval_incref(v.handle);
    internal::_emval_decref(handle);
    handle = v.handle;
    return *this;
  }

  bool hasOwnProperty(const char* key) const {
    return val::global("Object")["prototype"]["hasOwnProperty"].call<bool>("call", *this, val(key));
  }

  bool isNull() const {
    return handle == EM_VAL(internal::_EMVAL_NULL);
  }

  bool isUndefined() const {
    return handle == EM_VAL(internal::_EMVAL_UNDEFINED);
  }

  bool isTrue() const {
    return handle == EM_VAL(internal::_EMVAL_TRUE);
  }

  bool isFalse() const {
    return handle == EM_VAL(internal::_EMVAL_FALSE);
  }

  bool isNumber() const {
    return internal::_emval_is_number(handle);
  }

  bool isString() const {
    return internal::_emval_is_string(handle);
  }

  bool isArray() const {
    return instanceof(global("Array"));
  }

  bool equals(const val& v) const {
    return internal::_emval_equals(handle, v.handle);
  }

  bool operator==(const val& v) const {
    return internal::_emval_equals(handle, v.handle);
  }

  bool operator!=(const val& v) const {
    return !(*this == v);
  }

  bool strictlyEquals(const val& v) const {
    return internal::_emval_strictly_equals(handle, v.handle);
  }

  bool operator>(const val& v) const {
    return internal::_emval_greater_than(handle, v.handle);
  }

  bool operator>=(const val& v) const {
    return (*this > v) || (*this == v);
  }

  bool operator<(const val& v) const {
    return internal::_emval_less_than(handle, v.handle);
  }

  bool operator<=(const val& v) const {
    return (*this < v) || (*this == v);
  }

  bool operator!() const {
    return internal::_emval_not(handle);
  }

  template<typename... Args>
  val new_(Args&&... args) const {
    return internalCall(internal::_emval_new, std::forward<Args>(args)...);
  }

  template<typename T>
  val operator[](const T& key) const {
    return val(internal::_emval_get_property(handle, val_ref(key).handle));
  }

  template<typename K, typename V>
  void set(const K& key, const V& value) {
    internal::_emval_set_property(handle, val_ref(key).handle, val_ref(value).handle);
  }

  template<typename T>
  bool delete_(const T& property) const {
    return internal::_emval_delete(handle, val_ref(property).handle);
  }

  template<typename... Args>
  val operator()(Args&&... args) const {
    return internalCall(internal::_emval_call, std::forward<Args>(args)...);
  }

  template<typename ReturnValue, typename... Args>
  ReturnValue call(const char* name, Args&&... args) const {
    using namespace internal;

    return MethodCaller<ReturnValue, Args...>::call(handle, name, std::forward<Args>(args)...);
  }

  template<typename T, typename ...Policies>
  T as(Policies...) const {
    using namespace internal;

    typedef BindingType<T> BT;
    typename WithPolicies<Policies...>::template ArgTypeList<T> targetType;

    EM_DESTRUCTORS destructors;
    EM_GENERIC_WIRE_TYPE result = _emval_as(
        handle,
        targetType.getTypes()[0],
        &destructors);
    DestructorsRunner dr(destructors);
    return fromGenericWireType<T>(result);
  }

  template<>
  int64_t as<int64_t>() const {
    using namespace internal;

    typedef BindingType<int64_t> BT;
    typename WithPolicies<>::template ArgTypeList<int64_t> targetType;

    return _emval_as_int64(handle, targetType.getTypes()[0]);
  }

  template<>
  uint64_t as<uint64_t>() const {
    using namespace internal;

    typedef BindingType<uint64_t> BT;
    typename WithPolicies<>::template ArgTypeList<uint64_t> targetType;

    return  _emval_as_uint64(handle, targetType.getTypes()[0]);
  }

// If code is not being compiled with GNU extensions enabled, typeof() is not a reserved keyword, so support that as a member function.
#if __STRICT_ANSI__
  val typeof() const {
    return val(internal::_emval_typeof(handle));
  }
#endif

// Prefer calling val::typeOf() over val::typeof(), since this form works in both C++11 and GNU++11 build modes. "typeof" is a reserved word in GNU++11 extensions.
  val typeOf() const {
    return val(internal::_emval_typeof(handle));
  }

  bool instanceof(const val& v) const {
    return internal::_emval_instanceof(handle, v.handle);
  }

  bool in(const val& v) const {
    return internal::_emval_in(handle, v.handle);
  }

  [[noreturn]] void throw_() const {
    internal::_emval_throw(handle);
  }

  val await() const {
    return val(internal::_emval_await(handle));
  }

private:
  // takes ownership, assumes handle already incref'd
  explicit val(EM_VAL handle)
      : handle(handle)
  {}

  template<typename WrapperType>
  friend val internal::wrapped_extend(const std::string& , const val& );

  template<typename Implementation, typename... Args>
  val internalCall(Implementation impl, Args&&... args) const {
    using namespace internal;

    WithPolicies<>::ArgTypeList<Args...> argList;
    WireTypePack<Args...> argv(std::forward<Args>(args)...);
    return val(impl(handle, argList.getCount(), argList.getTypes(), argv));
  }

  template<typename T>
  val val_ref(const T& v) const {
    return val(v);
  }

  const val& val_ref(const val& v) const {
    return v;
  }

  EM_VAL handle;

  friend struct internal::BindingType<val>;
};

namespace internal {

template<>
struct BindingType<val> {
  typedef EM_VAL WireType;
  typedef const facebook::jsi::Value WireType2;

  static WireType toWireType(const val& v) {
    _emval_incref(v.handle);
    return v.handle;
  }
  static val fromWireType(WireType v) {
    return val::take_ownership(v);
  }

    static WireType2 toWireType2(facebook::jsi::Runtime& rt, const val& v) {
        _emval_incref(v.handle);
        return facebook::jsi::BigInt::fromUint64(rt, reinterpret_cast<uint64_t>(v.handle));
    }
    static val fromWireType2(facebook::jsi::Runtime& rt, WireType2& v) {
      // return val::undefined();
        // return val::take_ownership(reinterpret_cast<EM_VAL>((int) v.getNumber()));
        return val::take_ownership(reinterpret_cast<EM_VAL>(v.asBigInt(rt).asUint64(rt)));
    }
};

}

template <typename T, typename... Policies>
std::vector<T> vecFromJSArray(const val& v, Policies... policies) {
  const size_t l = v["length"].as<size_t>();

  std::vector<T> rv;
  rv.reserve(l);
  for (size_t i = 0; i < l; ++i) {
    rv.push_back(v[i].as<T>(std::forward<Policies>(policies)...));
  }

  return rv;
}

template <typename T>
std::vector<T> convertJSArrayToNumberVector(const val& v) {
  const size_t l = v["length"].as<size_t>();

  std::vector<T> rv;
  rv.resize(l);

  // Copy the array into our vector through the use of typed arrays.
  // It will try to convert each element through Number().
  // See https://www.ecma-international.org/ecma-262/6.0/#sec-%typedarray%.prototype.set-array-offset
  // and https://www.ecma-international.org/ecma-262/6.0/#sec-tonumber
  val memoryView{ typed_memory_view(l, rv.data()) };
  memoryView.call<void>("set", v);

  return rv;
}

} // end namespace emscripten