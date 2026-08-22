# @crossbind/port-expat
**Precompiled Expat (XML parser) library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@crossbind/port-expat">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-expat?style=for-the-badge" />
</a>
<a href="https://github.com/libexpat/libexpat">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-expat%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=Expat" />
</a>
<a href="https://github.com/libexpat/libexpat/blob/master/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-expat?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-expat @crossbind/port-expat-wasm @crossbind/port-expat-android @crossbind/port-expat-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import expatWasm from '@crossbind/port-expat-wasm/crossbind.config.js';
+import expatAndroid from '@crossbind/port-expat-android/crossbind.config.js';
+import expatIos from '@crossbind/port-expat-ios/crossbind.config.js';

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
| WebAssembly | [`@crossbind/port-expat-wasm`](https://www.npmjs.com/package/@crossbind/port-expat-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-expat-android`](https://www.npmjs.com/package/@crossbind/port-expat-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-expat-ios`](https://www.npmjs.com/package/@crossbind/port-expat-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled Expat library, which is distributed under the [MIT License](https://github.com/libexpat/libexpat/blob/master/COPYING).

Expat Homepage: [https://github.com/libexpat/libexpat](https://github.com/libexpat/libexpat)
