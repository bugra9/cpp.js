# @crossbind/port-tiff
**Precompiled TIFF (libtiff) image library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-tiff">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-tiff?style=for-the-badge" />
</a>
<a href="https://gitlab.com/libtiff/libtiff">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-tiff%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=TIFF" />
</a>
<a href="https://libtiff.gitlab.io/libtiff/project/license.html">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-tiff?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-tiff @crossbind/port-tiff-wasm @crossbind/port-tiff-android @crossbind/port-tiff-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import tiffWasm from '@crossbind/port-tiff-wasm/crossbind.config.js';
+import tiffAndroid from '@crossbind/port-tiff-android/crossbind.config.js';
+import tiffIos from '@crossbind/port-tiff-ios/crossbind.config.js';

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
| WebAssembly | [`@crossbind/port-tiff-wasm`](https://www.npmjs.com/package/@crossbind/port-tiff-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-tiff-android`](https://www.npmjs.com/package/@crossbind/port-tiff-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-tiff-ios`](https://www.npmjs.com/package/@crossbind/port-tiff-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled libtiff library, which is distributed under the [libtiff License](https://libtiff.gitlab.io/libtiff/project/license.html).

Tiff Homepage: [https://libtiff.gitlab.io/libtiff/index.html](https://libtiff.gitlab.io/libtiff/index.html)
