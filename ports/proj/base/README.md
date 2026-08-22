# @crossbind/port-proj
**Precompiled PROJ coordinate-transformation library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-proj">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-proj?style=for-the-badge" />
</a>
<a href="https://github.com/OSGeo/PROJ">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-proj%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=PROJ" />
</a>
<a href="https://github.com/OSGeo/PROJ/blob/master/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-proj?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-proj @crossbind/port-proj-wasm @crossbind/port-proj-android @crossbind/port-proj-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import projWasm from '@crossbind/port-proj-wasm/crossbind.config.js';
+import projAndroid from '@crossbind/port-proj-android/crossbind.config.js';
+import projIos from '@crossbind/port-proj-ios/crossbind.config.js';

export default {
    dependencies: [
+        projWasm,
+        projAndroid,
+        projIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use PROJ in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <proj.h>

double Native::sample() {
+    return proj_torad(15.6);
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@crossbind/port-proj-wasm`](https://www.npmjs.com/package/@crossbind/port-proj-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-proj-android`](https://www.npmjs.com/package/@crossbind/port-proj-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-proj-ios`](https://www.npmjs.com/package/@crossbind/port-proj-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled PROJ library, which is distributed under the [MIT License](https://github.com/OSGeo/PROJ/blob/master/COPYING).

Proj Homepage: [https://proj.org/](https://proj.org/)
