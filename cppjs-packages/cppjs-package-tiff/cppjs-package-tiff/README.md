# @cpp.js/package-tiff
**Precompiled TIFF (libtiff) image library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@cpp.js/package-tiff">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-tiff?style=for-the-badge" />
</a>
<a href="https://gitlab.com/libtiff/libtiff">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-tiff%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=TIFF" />
</a>
<a href="https://libtiff.gitlab.io/libtiff/project/license.html">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-tiff?style=for-the-badge" />
</a>

> Use it together with **[cpp.js](https://cpp.js.org)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[cpp.js.org](https://cpp.js.org)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @cpp.js/package-tiff @cpp.js/package-tiff-wasm @cpp.js/package-tiff-android @cpp.js/package-tiff-ios
```

Then import all three platforms in `cppjs.config.js` — cpp.js compiles only the one matching each build target:

```diff
+import tiffWasm from '@cpp.js/package-tiff-wasm/cppjs.config.js';
+import tiffAndroid from '@cpp.js/package-tiff-android/cppjs.config.js';
+import tiffIos from '@cpp.js/package-tiff-ios/cppjs.config.js';

export default {
    dependencies: [
+        tiffWasm,
+        tiffAndroid,
+        tiffIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use TIFF in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <tiffio.h>

std::string Native::sample() {
+    return std::string(TIFFGetVersion());
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@cpp.js/package-tiff-wasm`](https://www.npmjs.com/package/@cpp.js/package-tiff-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@cpp.js/package-tiff-android`](https://www.npmjs.com/package/@cpp.js/package-tiff-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@cpp.js/package-tiff-ios`](https://www.npmjs.com/package/@cpp.js/package-tiff-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled libtiff library, which is distributed under the [libtiff License](https://libtiff.gitlab.io/libtiff/project/license.html).

Tiff Homepage: [https://libtiff.gitlab.io/libtiff/index.html](https://libtiff.gitlab.io/libtiff/index.html)
