# @cpp.js/package-jpegturbo
**Precompiled libjpeg-turbo (JPEG) library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-jpegturbo">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-jpegturbo?style=for-the-badge" />
</a>
<a href="https://github.com/libjpeg-turbo/libjpeg-turbo">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-jpegturbo%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=LIBJPEG-TURBO" />
</a>
<a href="https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/LICENSE.md">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-jpegturbo?style=for-the-badge" />
</a>

> Use it together with **[cpp.js](https://cpp.js.org)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[cpp.js.org](https://cpp.js.org)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @cpp.js/package-jpegturbo @cpp.js/package-jpegturbo-wasm @cpp.js/package-jpegturbo-android @cpp.js/package-jpegturbo-ios
```

Then import all three platforms in `cppjs.config.js` — cpp.js compiles only the one matching each build target:

```diff
+import jpegturboWasm from '@cpp.js/package-jpegturbo-wasm/cppjs.config.js';
+import jpegturboAndroid from '@cpp.js/package-jpegturbo-android/cppjs.config.js';
+import jpegturboIos from '@cpp.js/package-jpegturbo-ios/cppjs.config.js';

export default {
    dependencies: [
+        jpegturboWasm,
+        jpegturboAndroid,
+        jpegturboIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use libjpeg-turbo in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <jpeglib.h>

std::string Native::sample() {
+    return LIBJPEG_TURBO_VERSION;
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@cpp.js/package-jpegturbo-wasm`](https://www.npmjs.com/package/@cpp.js/package-jpegturbo-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@cpp.js/package-jpegturbo-android`](https://www.npmjs.com/package/@cpp.js/package-jpegturbo-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@cpp.js/package-jpegturbo-ios`](https://www.npmjs.com/package/@cpp.js/package-jpegturbo-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled libjpeg-turbo library, which is distributed under the [libjpeg-turbo Licenses](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/LICENSE.md) (IJG AND BSD-3-Clause AND Zlib).

libjpeg-turbo Homepage: [https://libjpeg-turbo.org](https://libjpeg-turbo.org)
