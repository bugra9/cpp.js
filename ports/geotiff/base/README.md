# @crossbind/port-geotiff
**Precompiled libgeotiff (GeoTIFF) library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-geotiff">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-geotiff?style=for-the-badge" />
</a>
<a href="https://github.com/OSGeo/libgeotiff">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-geotiff%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=GeoTIFF" />
</a>
<a href="https://github.com/OSGeo/libgeotiff/blob/master/libgeotiff/LICENSE">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-geotiff?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-geotiff @crossbind/port-geotiff-wasm @crossbind/port-geotiff-android @crossbind/port-geotiff-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import geotiffWasm from '@crossbind/port-geotiff-wasm/crossbind.config.js';
+import geotiffAndroid from '@crossbind/port-geotiff-android/crossbind.config.js';
+import geotiffIos from '@crossbind/port-geotiff-ios/crossbind.config.js';

export default {
    dependencies: [
+        geotiffWasm,
+        geotiffAndroid,
+        geotiffIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use libgeotiff in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <geotiff.h>

std::string Native::sample() {
+    return to_string(LIBGEOTIFF_VERSION);
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@crossbind/port-geotiff-wasm`](https://www.npmjs.com/package/@crossbind/port-geotiff-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-geotiff-android`](https://www.npmjs.com/package/@crossbind/port-geotiff-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-geotiff-ios`](https://www.npmjs.com/package/@crossbind/port-geotiff-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled libgeotiff library, which is distributed under the [MIT License](https://github.com/OSGeo/libgeotiff/blob/master/libgeotiff/LICENSE).

GeoTiff Homepage: [https://github.com/OSGeo/libgeotiff](https://github.com/OSGeo/libgeotiff)
