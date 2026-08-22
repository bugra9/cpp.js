# @crossbind/port-spatialite
**Precompiled SpatiaLite (spatial SQLite extension) library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-spatialite">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-spatialite?style=for-the-badge" />
</a>
<a href="https://www.gaia-gis.it/fossil/libspatialite/index">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-spatialite%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=SpatiaLite" />
</a>
<a href="https://website-archive.mozilla.org/www.mozilla.org/mpl/MPL/boilerplate-1.1/mpl-tri-license-html">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-spatialite?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-spatialite @crossbind/port-spatialite-wasm @crossbind/port-spatialite-android @crossbind/port-spatialite-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import spatialiteWasm from '@crossbind/port-spatialite-wasm/crossbind.config.js';
+import spatialiteAndroid from '@crossbind/port-spatialite-android/crossbind.config.js';
+import spatialiteIos from '@crossbind/port-spatialite-ios/crossbind.config.js';

export default {
    dependencies: [
+        spatialiteWasm,
+        spatialiteAndroid,
+        spatialiteIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use SpatiaLite in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <spatialite.h>

std::string Native::sample() {
+    return std::string(spatialite_version());
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@crossbind/port-spatialite-wasm`](https://www.npmjs.com/package/@crossbind/port-spatialite-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-spatialite-android`](https://www.npmjs.com/package/@crossbind/port-spatialite-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-spatialite-ios`](https://www.npmjs.com/package/@crossbind/port-spatialite-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled SpatiaLite library, which is distributed under the [MPL tri-license](https://website-archive.mozilla.org/www.mozilla.org/mpl/MPL/boilerplate-1.1/mpl-tri-license-html).

Spatialite Homepage: [https://www.gaia-gis.it/fossil/libspatialite/index](https://www.gaia-gis.it/fossil/libspatialite/index)
