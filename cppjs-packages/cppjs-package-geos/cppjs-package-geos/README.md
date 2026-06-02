# @cpp.js/package-geos
**Precompiled GEOS geometry library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@cpp.js/package-geos">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-geos?style=for-the-badge" />
</a>
<a href="https://github.com/libgeos/geos">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-geos%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=Geos" />
</a>
<a href="https://github.com/libgeos/geos/blob/main/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-geos?style=for-the-badge" />
</a>

> Use it together with **[cpp.js](https://cpp.js.org)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[cpp.js.org](https://cpp.js.org)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @cpp.js/package-geos @cpp.js/package-geos-wasm @cpp.js/package-geos-android @cpp.js/package-geos-ios
```

Then import all three platforms in `cppjs.config.js` — cpp.js compiles only the one matching each build target:

```diff
+import geosWasm from '@cpp.js/package-geos-wasm/cppjs.config.js';
+import geosAndroid from '@cpp.js/package-geos-android/cppjs.config.js';
+import geosIos from '@cpp.js/package-geos-ios/cppjs.config.js';

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
| WebAssembly | [`@cpp.js/package-geos-wasm`](https://www.npmjs.com/package/@cpp.js/package-geos-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@cpp.js/package-geos-android`](https://www.npmjs.com/package/@cpp.js/package-geos-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@cpp.js/package-geos-ios`](https://www.npmjs.com/package/@cpp.js/package-geos-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled GEOS library, which is distributed under the [LGPL License](https://github.com/libgeos/geos/blob/main/COPYING).

GEOS Homepage: [https://github.com/libgeos/geos](https://github.com/libgeos/geos)
