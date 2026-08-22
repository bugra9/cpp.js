# @crossbind/port-jpegturbo
**Precompiled libjpeg-turbo (JPEG) library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@crossbind/port-jpegturbo">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-jpegturbo?style=for-the-badge" />
</a>
<a href="https://github.com/libjpeg-turbo/libjpeg-turbo">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-jpegturbo%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=LIBJPEG-TURBO" />
</a>
<a href="https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/LICENSE.md">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-jpegturbo?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-jpegturbo @crossbind/port-jpegturbo-wasm @crossbind/port-jpegturbo-android @crossbind/port-jpegturbo-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import jpegturboWasm from '@crossbind/port-jpegturbo-wasm/crossbind.config.js';
+import jpegturboAndroid from '@crossbind/port-jpegturbo-android/crossbind.config.js';
+import jpegturboIos from '@crossbind/port-jpegturbo-ios/crossbind.config.js';

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
| WebAssembly | [`@crossbind/port-jpegturbo-wasm`](https://www.npmjs.com/package/@crossbind/port-jpegturbo-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-jpegturbo-android`](https://www.npmjs.com/package/@crossbind/port-jpegturbo-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-jpegturbo-ios`](https://www.npmjs.com/package/@crossbind/port-jpegturbo-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled libjpeg-turbo library, which is distributed under the [libjpeg-turbo Licenses](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/LICENSE.md) (IJG AND BSD-3-Clause AND Zlib).

libjpeg-turbo Homepage: [https://libjpeg-turbo.org](https://libjpeg-turbo.org)
