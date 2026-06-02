# @cpp.js/package-lerc
**Precompiled LERC (Limited Error Raster Compression) library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@cpp.js/package-lerc">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-lerc?style=for-the-badge" />
</a>
<a href="https://github.com/Esri/lerc">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-lerc%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=LERC" />
</a>
<a href="https://github.com/Esri/lerc/blob/master/LICENSE">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-lerc?style=for-the-badge" />
</a>

> Use it together with **[cpp.js](https://cpp.js.org)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[cpp.js.org](https://cpp.js.org)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @cpp.js/package-lerc @cpp.js/package-lerc-wasm @cpp.js/package-lerc-android @cpp.js/package-lerc-ios
```

Then import all three platforms in `cppjs.config.js` — cpp.js compiles only the one matching each build target:

```diff
+import lercWasm from '@cpp.js/package-lerc-wasm/cppjs.config.js';
+import lercAndroid from '@cpp.js/package-lerc-android/cppjs.config.js';
+import lercIos from '@cpp.js/package-lerc-ios/cppjs.config.js';

export default {
    dependencies: [
+        lercWasm,
+        lercAndroid,
+        lercIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use LERC in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <Lerc_c_api.h>

int Native::sample() {
+    return LERC_VERSION_MAJOR;
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@cpp.js/package-lerc-wasm`](https://www.npmjs.com/package/@cpp.js/package-lerc-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@cpp.js/package-lerc-android`](https://www.npmjs.com/package/@cpp.js/package-lerc-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@cpp.js/package-lerc-ios`](https://www.npmjs.com/package/@cpp.js/package-lerc-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled LERC library, which is distributed under the [LERC License](https://github.com/Esri/lerc/blob/master/LICENSE).

LERC Homepage: [https://github.com/Esri/lerc](https://github.com/Esri/lerc)
