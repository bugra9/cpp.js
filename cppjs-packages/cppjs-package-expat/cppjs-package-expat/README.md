# @cpp.js/package-expat
**Precompiled Expat (XML parser) library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-expat">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-expat?style=for-the-badge" />
</a>
<a href="https://github.com/libexpat/libexpat">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-expat%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=Expat" />
</a>
<a href="https://github.com/libexpat/libexpat/blob/master/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-expat?style=for-the-badge" />
</a>

> Use it together with **[cpp.js](https://cpp.js.org)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[cpp.js.org](https://cpp.js.org)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @cpp.js/package-expat @cpp.js/package-expat-wasm @cpp.js/package-expat-android @cpp.js/package-expat-ios
```

Then import all three platforms in `cppjs.config.js` — cpp.js compiles only the one matching each build target:

```diff
+import expatWasm from '@cpp.js/package-expat-wasm/cppjs.config.js';
+import expatAndroid from '@cpp.js/package-expat-android/cppjs.config.js';
+import expatIos from '@cpp.js/package-expat-ios/cppjs.config.js';

export default {
    dependencies: [
+        expatWasm,
+        expatAndroid,
+        expatIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use Expat in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <expat.h>

std::string Native::sample() {
+    return std::string(XML_ExpatVersion());
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@cpp.js/package-expat-wasm`](https://www.npmjs.com/package/@cpp.js/package-expat-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@cpp.js/package-expat-android`](https://www.npmjs.com/package/@cpp.js/package-expat-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@cpp.js/package-expat-ios`](https://www.npmjs.com/package/@cpp.js/package-expat-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled Expat library, which is distributed under the [MIT License](https://github.com/libexpat/libexpat/blob/master/COPYING).

Expat Homepage: [https://github.com/libexpat/libexpat](https://github.com/libexpat/libexpat)
