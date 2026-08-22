---
name: emscripten
description: "Skill for the Emscripten area of crossbind. 207 symbols across 7 files."
---

# Emscripten

207 symbols | 7 files | Cohesion: 79%

## When to Use

- Working with code in `core/`
- Understanding how _emval_register_symbol, _emval_incref, _emval_decref work
- Modifying emscripten-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `core/embind-jsi/cpp/src/emscripten/bind.cpp` | toValue, _emval_register_symbol, _emval_incref, _emval_decref, _emval_run_destructors (+68) |
| `core/embind-jsi/cpp/src/emscripten/val.h` | _emval_get_property, _emval_set_property, _emval_as, _emval_as_int64, _emval_as_uint64 (+62) |
| `core/embind-jsi/cpp/src/emscripten/bind.h` | _embind_register_constant, constant, _embind_register_optional, _embind_register_class, _embind_register_class_property (+46) |
| `core/embind-rust/adapters/web.cpp` | crossbind_emval_opt_i32, crossbind_emval_opt_f64, crossbind_emval_opt_bool, crossbind_emval_opt_string, crossbind_emval_json_to_handle (+1) |
| `core/embind-rust/adapters/jsi.cpp` | crossbind_embind_register_enum, crossbind_embind_register_class_function, crossbind_embind_register_class_class_function, crossbind_embind_register_function |
| `core/embind-jsi/cpp/src/emscripten/wire.h` | typed_memory_view, getLightTypeID, ensureWindowFor, toWireType2 |
| `plugins/react-native/cpp/src/JSI_module.cpp` | jstring2string, Java_com_jsi_lib_RNJsiLibModule_install |

## Entry Points

Start here when exploring this area:

- **`_emval_register_symbol`** (Function) — `core/embind-jsi/cpp/src/emscripten/bind.cpp:165`
- **`_emval_incref`** (Function) — `core/embind-jsi/cpp/src/emscripten/bind.cpp:172`
- **`_emval_decref`** (Function) — `core/embind-jsi/cpp/src/emscripten/bind.cpp:178`
- **`_emval_run_destructors`** (Function) — `core/embind-jsi/cpp/src/emscripten/bind.cpp:184`
- **`_emval_set_property`** (Function) — `core/embind-jsi/cpp/src/emscripten/bind.cpp:264`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `class_` | Class | `core/embind-jsi/cpp/src/emscripten/bind.h` | 2139 |
| `val` | Class | `core/embind-jsi/cpp/src/emscripten/val.h` | 329 |
| `noncopyable` | Class | `core/embind-jsi/cpp/src/emscripten/bind.h` | 1131 |
| `value_object` | Class | `core/embind-jsi/cpp/src/emscripten/bind.h` | 1337 |
| `value_array` | Class | `core/embind-jsi/cpp/src/emscripten/bind.h` | 1161 |
| `val` | Class | `core/embind-jsi/cpp/src/emscripten/val.h` | 27 |
| `enum_` | Class | `core/embind-jsi/cpp/src/emscripten/bind.h` | 2802 |
| `WrapperBase` | Class | `core/embind-jsi/cpp/src/emscripten/bind.h` | 1640 |
| `wrapper` | Class | `core/embind-jsi/cpp/src/emscripten/bind.h` | 1654 |
| `_emval_register_symbol` | Function | `core/embind-jsi/cpp/src/emscripten/bind.cpp` | 165 |
| `_emval_incref` | Function | `core/embind-jsi/cpp/src/emscripten/bind.cpp` | 172 |
| `_emval_decref` | Function | `core/embind-jsi/cpp/src/emscripten/bind.cpp` | 178 |
| `_emval_run_destructors` | Function | `core/embind-jsi/cpp/src/emscripten/bind.cpp` | 184 |
| `_emval_set_property` | Function | `core/embind-jsi/cpp/src/emscripten/bind.cpp` | 264 |
| `_emval_as` | Function | `core/embind-jsi/cpp/src/emscripten/bind.cpp` | 272 |
| `_emval_call_method` | Function | `core/embind-jsi/cpp/src/emscripten/bind.cpp` | 354 |
| `_emval_call_void_method` | Function | `core/embind-jsi/cpp/src/emscripten/bind.cpp` | 365 |
| `_emval_throw` | Function | `core/embind-jsi/cpp/src/emscripten/bind.cpp` | 419 |
| `_embind_register_optional` | Function | `core/embind-jsi/cpp/src/emscripten/bind.cpp` | 559 |
| `_embind_register_value_array` | Function | `core/embind-jsi/cpp/src/emscripten/bind.cpp` | 567 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Register_vector → GetGenericSignature` | cross_community | 5 |
| `EMSCRIPTEN_BINDINGS → ToValue` | cross_community | 4 |
| `Wrapped_extend → _emval_new_cstring` | cross_community | 4 |
| `Wrapped_extend → _emval_incref` | cross_community | 4 |
| `Crossbind_embind_register_class_function → ReadArg` | cross_community | 4 |
| `Crossbind_embind_register_class_function → WireStringToJsi` | cross_community | 4 |
| `Crossbind_embind_register_class_function → ToValue` | cross_community | 4 |
| `Crossbind_embind_register_class_class_function → ReadArg` | cross_community | 4 |
| `Crossbind_embind_register_class_class_function → WireStringToJsi` | cross_community | 4 |
| `Crossbind_embind_register_class_class_function → ToValue` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Adapters | 3 calls |

## How to Explore

1. `context({name: "_emval_register_symbol"})` — see callers and callees
2. `query({search_query: "emscripten"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
