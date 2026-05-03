# Overview

cpp.js supports binding for most C++ constructs, including features from C++11 and C++14. The biggest constraint is that **raw pointers don't bind** — wrap them in `shared_ptr` or write a C++ wrapper.

The table below outlines the headings discussed in this section.

| [Data Types](/docs/api/cpp-bindings/data-types) | [Functions](/docs/api/cpp-bindings/functions) | [Classes and Objects](/docs/api/cpp-bindings/classes) | [SWIG escape](/docs/api/cpp-bindings/swig-escape) |
| ---------- | --------- | ------------------- | --- |
| Primitive Types | Function Call | Constructors, Member Functions | Manual `.i` files |
| Vector | Function Overloading | Inheritance | Custom typemaps |
| Map | | Polymorphism | Renaming / ignoring |
| Enum | | Interfaces (Abstract Classes) | |
| Class Object | | | |

## The 5 binding rules

Follow these and the auto-binder won't fight you.

1. **No raw pointers in the public surface.** Return `std::shared_ptr<T>` (or by value) instead of `T*`. Raw pointers either silently produce `null` or aren't bound at all.
2. **Definitions go in the header.** If a class is forward-declared in `.h` but defined only in `.cpp`, the binder doesn't see it. Put at least the public surface in the header.
3. **No anonymous namespaces or `static` at file scope on the public API.** Both hide symbols from the binder.
4. **No multiple inheritance.** SWIG can't model it cleanly; refactor to composition.
5. **Templates need explicit instantiation.** Add `template class X<int>;` somewhere in the header to materialize the symbols.

For everything else, the [wrapper pattern](#wrapper-pattern) below covers the cases the auto-binder won't.

## Wrapper pattern

When the upstream library uses raw pointers, multiple inheritance, or other unbindable patterns, write a thin C++ wrapper class that exposes binding-friendly types:

```cpp
// upstream lib (can't change this)
class LegacyImpl {
public:
    int* compute(int input);   // raw pointer return — won't bind
};

// your wrapper (in src/native/wrapper.h)
#include <memory>
#include <vector>
#include "legacy.h"

class Wrapper {
public:
    static std::vector<int> compute(int input) {
        int* result = LegacyImpl().compute(input);
        std::vector<int> out(result, result + 10);
        delete[] result;
        return out;
    }
};
```

cpp.js binds `Wrapper::compute` cleanly; JS calls `Module.Wrapper.compute(input)` and gets a JS array back.

## Advanced: JSPI flag (experimental)

The Emscripten `-sJSPI` flag enables JavaScript Promise Integration — letting C++ code call into JS-promising code synchronously (the C++ stack suspends on `await`).

You opt in via `targetSpecs[].specs.emccFlags` in `cppjs.config.js`:

```js
targetSpecs: [{
    platform: 'wasm',
    specs: { emccFlags: ['-sJSPI'] },
}]
```

### `_JSPI` naming convention

Once `-sJSPI` is enabled, **any C++ method or function that should be JSPI-wrapped must end with `_JSPI`**. The cpp.js auto-binder detects the suffix and emits `emscripten::async()` on the binding so the call returns a `Promise` on the JS side and the C++ stack can suspend mid-execution.

```cpp
// native.h
class Native {
public:
    static std::string sample();          // regular sync binding
    static void ops_JSPI();               // JSPI-wrapped — async on JS side
    static std::vector<std::string> listVirtualFiles_JSPI();
};
```

The auto-generated bridge becomes:

```cpp
.class_function("sample", &Native::sample)
.class_function("ops_JSPI", &Native::ops_JSPI, emscripten::async())
.class_function("listVirtualFiles_JSPI", &Native::listVirtualFiles_JSPI, emscripten::async())
```

On the JS side, call the function with the suffix preserved and `await` it:

```js
await Module.Native.ops_JSPI();
const files = await Module.Native.listVirtualFiles_JSPI();
```

If you forget the suffix, the binding stays synchronous; calls into JS promises from inside that C++ function will then crash with `Cannot suspend without JSPI` at runtime.

This is **experimental and Chrome-only** at the time of writing. Use cases: callbacks into JS that fetch network data, awaiting JS promises mid-C++. Don't enable it unless you specifically need synchronous cross-boundary `await`. See [Performance defaults](/docs/api/configuration/performance) for override safety.

## Common mistakes

1. **Returning a `unique_ptr` from a bindable function** — silently fails or returns null. Use `shared_ptr`.
2. **Defining the class in the `.cpp` only** — the binder needs the full definition in the header it scans.
3. **Anonymous namespaces wrapping the public API** — symbols stay hidden. Public API stays in named or no namespace.
4. **`extern "C"` decoration on C++ class methods** — invalid. Only use `extern "C"` for C-style free functions.
5. **Returning a reference or pointer to a stack object** — undefined behavior; the binder doesn't catch it. Always return by value or by `shared_ptr`.

## When the rules don't fit

Three escape hatches, in order of preference:

1. **Wrap it in C++** (the wrapper pattern above) — most maintainable.
2. **Write a `.i` file** — see [SWIG escape hatch](/docs/api/cpp-bindings/swig-escape) for selective custom typemaps.
3. **Open an issue** — if a common pattern keeps falling outside the auto-binder, the binder itself can be extended.

:::info
[Embind](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html) is utilized to bind C++ functions and classes to JavaScript. In WebAssembly, this functionality is provided by Emscripten. In React Native, the binding is achieved through the [@cpp.js/core-embind-jsi](https://github.com/bugra9/cpp.js/tree/main/cppjs-core/cppjs-core-embind-jsi) project, which replaces WebAssembly bindings with the JavaScript Interface (JSI).

The [bugra9/swig](https://github.com/bugra9/swig/tree/add-embind-support) project, a fork of the original [SWIG](https://github.com/swig/swig) project adapted to support Embind, is used to create Embind definitions.

In addition, a customized version of Embind is used to support overloaded functions. The modified version is accessible via [this link](https://github.com/emscripten-core/emscripten/pull/17445).
:::
