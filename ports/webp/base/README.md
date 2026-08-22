# @crossbind/port-webp
**Precompiled WebP image library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-webp">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-webp?style=for-the-badge" />
</a>
<a href="https://chromium.googlesource.com/webm/libwebp">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-webp%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=WebP" />
</a>
<a href="https://chromium.googlesource.com/webm/libwebp/+/refs/heads/main/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-webp?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-webp @crossbind/port-webp-wasm @crossbind/port-webp-android @crossbind/port-webp-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import webpWasm from '@crossbind/port-webp-wasm/crossbind.config.js';
+import webpAndroid from '@crossbind/port-webp-android/crossbind.config.js';
+import webpIos from '@crossbind/port-webp-ios/crossbind.config.js';

export default {
    dependencies: [
+        webpWasm,
+        webpAndroid,
+        webpIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use WebP in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <webp/decode.h>

std::string Native::sample() {
+    return std::to_string(WebPGetDecoderVersion());
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@crossbind/port-webp-wasm`](https://www.npmjs.com/package/@crossbind/port-webp-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-webp-android`](https://www.npmjs.com/package/@crossbind/port-webp-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-webp-ios`](https://www.npmjs.com/package/@crossbind/port-webp-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled WebP library, which is distributed under the [BSD 3-Clause License](https://chromium.googlesource.com/webm/libwebp/+/refs/heads/main/COPYING).

WebP Homepage: [https://developers.google.com/speed/webp](https://developers.google.com/speed/webp)
