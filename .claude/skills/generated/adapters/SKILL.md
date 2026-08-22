---
name: adapters
description: "Skill for the Adapters area of crossbind. 86 symbols across 7 files."
---

# Adapters

86 symbols | 7 files | Cohesion: 87%

## When to Use

- Working with code in `core/`
- Understanding how crossbind_embind_register_class, crossbind_embind_register_class_constructor, crossbind_embind_register_smart_ptr work
- Modifying adapters-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `core/embind-rust/adapters/jsi.cpp` | wireStringToJsi, readArg, callInvoker, wrapInvoker, crossbind_embind_register_class (+26) |
| `core/embind-rust/adapters/web.cpp` | _embind_register_class, _embind_register_smart_ptr, _embind_register_value_object, crossbind_embind_register_class, crossbind_embind_register_smart_ptr (+24) |
| `core/crossbind/src/assets/js-runtime/adapters/vector-coercion.js` | unwrapCoercionProxy, callWithVectorCoercion, wrapWithVectorCoercion, get, set (+6) |
| `core/crossbind/src/assets/js-runtime/adapters/worker-comlink.js` | registerEmbindObject, canHandle, serialize, registerModuleEnums, init (+2) |
| `core/crossbind/src/assets/js-runtime/adapters/exception-decode.js` | setExceptionDecodeModule, wrapOwnMethod, patchModuleForExceptionDecode, decodeCppException, decoded |
| `core/crossbind/src/assets/js-runtime/core.js` | isObject, mergeDeep |
| `scripts/e2e-templates/source.js` | invoke |

## Entry Points

Start here when exploring this area:

- **`crossbind_embind_register_class`** (Function) — `core/embind-rust/adapters/jsi.cpp:351`
- **`crossbind_embind_register_class_constructor`** (Function) — `core/embind-rust/adapters/jsi.cpp:368`
- **`crossbind_embind_register_smart_ptr`** (Function) — `core/embind-rust/adapters/jsi.cpp:397`
- **`crossbind_embind_register_value_object`** (Function) — `core/embind-rust/adapters/jsi.cpp:415`
- **`_embind_register_class`** (Function) — `core/embind-rust/adapters/web.cpp:139`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `crossbind_embind_register_class` | Function | `core/embind-rust/adapters/jsi.cpp` | 351 |
| `crossbind_embind_register_class_constructor` | Function | `core/embind-rust/adapters/jsi.cpp` | 368 |
| `crossbind_embind_register_smart_ptr` | Function | `core/embind-rust/adapters/jsi.cpp` | 397 |
| `crossbind_embind_register_value_object` | Function | `core/embind-rust/adapters/jsi.cpp` | 415 |
| `_embind_register_class` | Function | `core/embind-rust/adapters/web.cpp` | 139 |
| `_embind_register_smart_ptr` | Function | `core/embind-rust/adapters/web.cpp` | 145 |
| `_embind_register_value_object` | Function | `core/embind-rust/adapters/web.cpp` | 148 |
| `crossbind_embind_register_class` | Function | `core/embind-rust/adapters/web.cpp` | 152 |
| `crossbind_embind_register_smart_ptr` | Function | `core/embind-rust/adapters/web.cpp` | 173 |
| `crossbind_embind_register_value_object` | Function | `core/embind-rust/adapters/web.cpp` | 182 |
| `crossbind_embind_register_value_object_field` | Function | `core/embind-rust/adapters/jsi.cpp` | 421 |
| `_embind_register_class_constructor` | Function | `core/embind-rust/adapters/web.cpp` | 140 |
| `_embind_register_class_function` | Function | `core/embind-rust/adapters/web.cpp` | 141 |
| `_embind_register_class_class_function` | Function | `core/embind-rust/adapters/web.cpp` | 142 |
| `_embind_register_function` | Function | `core/embind-rust/adapters/web.cpp` | 143 |
| `_embind_register_value_object_field` | Function | `core/embind-rust/adapters/web.cpp` | 149 |
| `crossbind_embind_register_class_constructor` | Function | `core/embind-rust/adapters/web.cpp` | 155 |
| `crossbind_embind_register_class_function` | Function | `core/embind-rust/adapters/web.cpp` | 158 |
| `crossbind_embind_register_class_class_function` | Function | `core/embind-rust/adapters/web.cpp` | 161 |
| `crossbind_embind_register_function` | Function | `core/embind-rust/adapters/web.cpp` | 164 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Init → ThrowBindingError` | cross_community | 7 |
| `Init → Cwd` | cross_community | 6 |
| `Init → IsAbs` | cross_community | 6 |
| `Init → NormalizeArray` | cross_community | 6 |
| `Init → ShallowCopyInternalPointer` | cross_community | 6 |
| `Init → IsFileURI` | cross_community | 5 |
| `Init → Init_RegisteredPointer` | cross_community | 5 |
| `Init → BuildLocateFile` | cross_community | 4 |
| `Apply → Invoke` | cross_community | 4 |
| `Apply → DecodeCppException` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| E2e | 1 calls |

## How to Explore

1. `context({name: "crossbind_embind_register_class"})` — see callers and callees
2. `query({search_query: "adapters"})` — find related execution flows
3. Read key files listed above for implementation details
4. `explain({target: "<file or symbol>"})` — persisted taint findings (source→sink data flows), when indexed with `--pdg`
