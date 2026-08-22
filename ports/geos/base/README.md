# @crossbind/port-geos
**Precompiled GEOS geometry library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-geos">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-geos?style=for-the-badge" />
</a>
<a href="https://github.com/libgeos/geos">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-geos%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=Geos" />
</a>
<a href="https://github.com/libgeos/geos/blob/main/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-geos?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-geos @crossbind/port-geos-wasm @crossbind/port-geos-android @crossbind/port-geos-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import geosWasm from '@crossbind/port-geos-wasm/crossbind.config.js';
+import geosAndroid from '@crossbind/port-geos-android/crossbind.config.js';
+import geosIos from '@crossbind/port-geos-ios/crossbind.config.js';

export default {
    dependencies: [
+        geosWasm,
+        geosAndroid,
+        geosIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use GEOS in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <geos_c.h>

std::string Native::sample() {
+    return std::string(GEOSversion());
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@crossbind/port-geos-wasm`](https://www.npmjs.com/package/@crossbind/port-geos-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-geos-android`](https://www.npmjs.com/package/@crossbind/port-geos-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-geos-ios`](https://www.npmjs.com/package/@crossbind/port-geos-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled GEOS library, which is distributed under the [LGPL License](https://github.com/libgeos/geos/blob/main/COPYING).

GEOS Homepage: [https://github.com/libgeos/geos](https://github.com/libgeos/geos)
