# @crossbind/port-lerc
**Precompiled LERC (Limited Error Raster Compression) library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-lerc">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-lerc?style=for-the-badge" />
</a>
<a href="https://github.com/Esri/lerc">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-lerc%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=LERC" />
</a>
<a href="https://github.com/Esri/lerc/blob/master/LICENSE">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-lerc?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-lerc @crossbind/port-lerc-wasm @crossbind/port-lerc-android @crossbind/port-lerc-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import lercWasm from '@crossbind/port-lerc-wasm/crossbind.config.js';
+import lercAndroid from '@crossbind/port-lerc-android/crossbind.config.js';
+import lercIos from '@crossbind/port-lerc-ios/crossbind.config.js';

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
| WebAssembly | [`@crossbind/port-lerc-wasm`](https://www.npmjs.com/package/@crossbind/port-lerc-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-lerc-android`](https://www.npmjs.com/package/@crossbind/port-lerc-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-lerc-ios`](https://www.npmjs.com/package/@crossbind/port-lerc-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled LERC library, which is distributed under the [LERC License](https://github.com/Esri/lerc/blob/master/LICENSE).

LERC Homepage: [https://github.com/Esri/lerc](https://github.com/Esri/lerc)
