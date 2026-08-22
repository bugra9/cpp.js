# @crossbind/port-gdal
**Precompiled GDAL geospatial library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-gdal">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-gdal?style=for-the-badge" />
</a>
<a href="https://github.com/OSGeo/gdal">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-gdal%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=GDAL" />
</a>
<a href="https://github.com/OSGeo/gdal/blob/master/LICENSE.TXT">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-gdal?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-gdal @crossbind/port-gdal-wasm @crossbind/port-gdal-android @crossbind/port-gdal-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import gdalWasm from '@crossbind/port-gdal-wasm/crossbind.config.js';
+import gdalAndroid from '@crossbind/port-gdal-android/crossbind.config.js';
+import gdalIos from '@crossbind/port-gdal-ios/crossbind.config.js';

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
| WebAssembly | [`@crossbind/port-gdal-wasm`](https://www.npmjs.com/package/@crossbind/port-gdal-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-gdal-android`](https://www.npmjs.com/package/@crossbind/port-gdal-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-gdal-ios`](https://www.npmjs.com/package/@crossbind/port-gdal-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled GDAL library, which is distributed under the [MIT License](https://github.com/OSGeo/gdal/blob/master/LICENSE.TXT).

GDAL Homepage: [https://gdal.org/](https://gdal.org/)
