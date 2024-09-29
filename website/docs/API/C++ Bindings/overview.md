# Overview
Cpp.js supports binding for most C++ constructs, including features from C++11 and C++14. The only major limitation is the lack of support for raw pointers at this time.

:::info
[Embind](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html) is utilized to bind C++ functions and classes to JavaScript. In WebAssembly, this functionality is provided by Emscripten. In React Native, the binding is achieved through the [cppjs-core-rn-embind](https://github.com/bugra9/cpp.js/tree/main/core/cppjs-core-rn-embind) project, which replaces WebAssembly bindings with JavaScript Interface (JSI).

The [bugra9/swig](https://github.com/bugra9/swig/tree/add-embind-support) project, a fork of the original [Swig](https://github.com/swig/swig) project adapted to support Embind, is used to create Embind definitions.

In addition, a customized version of Embind is used to support overloaded functions. The modified version is accessible via [this link](https://github.com/emscripten-core/emscripten/pull/17445).
:::
