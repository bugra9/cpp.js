# @cpp.js/package-proj
**Precompiled PROJ coordinate-transformation library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@cpp.js/package-proj">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-proj?style=for-the-badge" />
</a>
<a href="https://github.com/OSGeo/PROJ">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-proj%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=PROJ" />
</a>
<a href="https://github.com/OSGeo/PROJ/blob/master/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-proj?style=for-the-badge" />
</a>

> Use it together with **[cpp.js](https://cpp.js.org)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[cpp.js.org](https://cpp.js.org)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @cpp.js/package-proj @cpp.js/package-proj-wasm @cpp.js/package-proj-android @cpp.js/package-proj-ios
```

Then import all three platforms in `cppjs.config.js` — cpp.js compiles only the one matching each build target:

```diff
+import projWasm from '@cpp.js/package-proj-wasm/cppjs.config.js';
+import projAndroid from '@cpp.js/package-proj-android/cppjs.config.js';
+import projIos from '@cpp.js/package-proj-ios/cppjs.config.js';

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
| WebAssembly | [`@cpp.js/package-proj-wasm`](https://www.npmjs.com/package/@cpp.js/package-proj-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@cpp.js/package-proj-android`](https://www.npmjs.com/package/@cpp.js/package-proj-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@cpp.js/package-proj-ios`](https://www.npmjs.com/package/@cpp.js/package-proj-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled PROJ library, which is distributed under the [MIT License](https://github.com/OSGeo/PROJ/blob/master/COPYING).

Proj Homepage: [https://proj.org/](https://proj.org/)
