# @crossbind/port-zlib
**Precompiled zlib library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@crossbind/port-zlib">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-zlib?style=for-the-badge" />
</a>
<a href="https://zlib.net/">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-zlib%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=zlib" />
</a>
<a href="https://zlib.net/zlib_license.html">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-zlib?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-zlib @crossbind/port-zlib-wasm @crossbind/port-zlib-android @crossbind/port-zlib-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import zlibWasm from '@crossbind/port-zlib-wasm/crossbind.config.js';
+import zlibAndroid from '@crossbind/port-zlib-android/crossbind.config.js';
+import zlibIos from '@crossbind/port-zlib-ios/crossbind.config.js';

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
| WebAssembly | [`@crossbind/port-zlib-wasm`](https://www.npmjs.com/package/@crossbind/port-zlib-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-zlib-android`](https://www.npmjs.com/package/@crossbind/port-zlib-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-zlib-ios`](https://www.npmjs.com/package/@crossbind/port-zlib-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled zlib library, which is distributed under the [zlib License](https://zlib.net/zlib_license.html).

Zlib Homepage: [https://zlib.net/](https://zlib.net/)
