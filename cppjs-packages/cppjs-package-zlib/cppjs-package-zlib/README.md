# @cpp.js/package-zlib
**Precompiled zlib library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-zlib">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-zlib?style=for-the-badge" />
</a>
<a href="https://zlib.net/">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-zlib%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=zlib" />
</a>
<a href="https://zlib.net/zlib_license.html">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-zlib?style=for-the-badge" />
</a>

> Use it together with **[cpp.js](https://cpp.js.org)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[cpp.js.org](https://cpp.js.org)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @cpp.js/package-zlib @cpp.js/package-zlib-wasm @cpp.js/package-zlib-android @cpp.js/package-zlib-ios
```

Then import all three platforms in `cppjs.config.js` — cpp.js compiles only the one matching each build target:

```diff
+import zlibWasm from '@cpp.js/package-zlib-wasm/cppjs.config.js';
+import zlibAndroid from '@cpp.js/package-zlib-android/cppjs.config.js';
+import zlibIos from '@cpp.js/package-zlib-ios/cppjs.config.js';

export default {
    dependencies: [
+        zlibWasm,
+        zlibAndroid,
+        zlibIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the zlib in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <zlib.h>

std::string Native::sample() {
+    return std::string(zlibVersion());
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@cpp.js/package-zlib-wasm`](https://www.npmjs.com/package/@cpp.js/package-zlib-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@cpp.js/package-zlib-android`](https://www.npmjs.com/package/@cpp.js/package-zlib-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@cpp.js/package-zlib-ios`](https://www.npmjs.com/package/@cpp.js/package-zlib-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled zlib library, which is distributed under the [zlib License](https://zlib.net/zlib_license.html).

Zlib Homepage: [https://zlib.net/](https://zlib.net/)
