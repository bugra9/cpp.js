# @cpp.js/package-gdal
**Precompiled GDAL geospatial library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@cpp.js/package-gdal">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-gdal?style=for-the-badge" />
</a>
<a href="https://github.com/OSGeo/gdal">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-gdal%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=GDAL" />
</a>
<a href="https://github.com/OSGeo/gdal/blob/master/LICENSE.TXT">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-gdal?style=for-the-badge" />
</a>

> Use it together with **[cpp.js](https://cpp.js.org)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[cpp.js.org](https://cpp.js.org)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @cpp.js/package-gdal @cpp.js/package-gdal-wasm @cpp.js/package-gdal-android @cpp.js/package-gdal-ios
```

Then import all three platforms in `cppjs.config.js` — cpp.js compiles only the one matching each build target:

```diff
+import gdalWasm from '@cpp.js/package-gdal-wasm/cppjs.config.js';
+import gdalAndroid from '@cpp.js/package-gdal-android/cppjs.config.js';
+import gdalIos from '@cpp.js/package-gdal-ios/cppjs.config.js';

export default {
    dependencies: [
+        gdalWasm,
+        gdalAndroid,
+        gdalIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use GDAL in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <gdal.h>

std::string Native::sample() {
+    return std::string(GDAL_RELEASE_NAME);
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@cpp.js/package-gdal-wasm`](https://www.npmjs.com/package/@cpp.js/package-gdal-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@cpp.js/package-gdal-android`](https://www.npmjs.com/package/@cpp.js/package-gdal-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@cpp.js/package-gdal-ios`](https://www.npmjs.com/package/@cpp.js/package-gdal-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled GDAL library, which is distributed under the [MIT License](https://github.com/OSGeo/gdal/blob/master/LICENSE.TXT).

GDAL Homepage: [https://gdal.org/](https://gdal.org/)
