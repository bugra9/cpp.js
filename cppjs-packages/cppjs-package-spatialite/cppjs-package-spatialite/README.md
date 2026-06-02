# @cpp.js/package-spatialite
**Precompiled SpatiaLite (spatial SQLite extension) library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@cpp.js/package-spatialite">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-spatialite?style=for-the-badge" />
</a>
<a href="https://www.gaia-gis.it/fossil/libspatialite/index">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-spatialite%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=SpatiaLite" />
</a>
<a href="https://website-archive.mozilla.org/www.mozilla.org/mpl/MPL/boilerplate-1.1/mpl-tri-license-html">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-spatialite?style=for-the-badge" />
</a>

> Use it together with **[cpp.js](https://cpp.js.org)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[cpp.js.org](https://cpp.js.org)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @cpp.js/package-spatialite @cpp.js/package-spatialite-wasm @cpp.js/package-spatialite-android @cpp.js/package-spatialite-ios
```

Then import all three platforms in `cppjs.config.js` — cpp.js compiles only the one matching each build target:

```diff
+import spatialiteWasm from '@cpp.js/package-spatialite-wasm/cppjs.config.js';
+import spatialiteAndroid from '@cpp.js/package-spatialite-android/cppjs.config.js';
+import spatialiteIos from '@cpp.js/package-spatialite-ios/cppjs.config.js';

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
| WebAssembly | [`@cpp.js/package-spatialite-wasm`](https://www.npmjs.com/package/@cpp.js/package-spatialite-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@cpp.js/package-spatialite-android`](https://www.npmjs.com/package/@cpp.js/package-spatialite-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@cpp.js/package-spatialite-ios`](https://www.npmjs.com/package/@cpp.js/package-spatialite-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled SpatiaLite library, which is distributed under the [MPL tri-license](https://website-archive.mozilla.org/www.mozilla.org/mpl/MPL/boilerplate-1.1/mpl-tri-license-html).

Spatialite Homepage: [https://www.gaia-gis.it/fossil/libspatialite/index](https://www.gaia-gis.it/fossil/libspatialite/index)
