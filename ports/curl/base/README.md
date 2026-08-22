# @crossbind/port-curl
**Precompiled libcurl (CURL) library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-curl">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-curl?style=for-the-badge" />
</a>
<a href="https://github.com/curl/curl">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-curl%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=curl" />
</a>
<a href="https://github.com/curl/curl/blob/master/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-curl?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-curl @crossbind/port-curl-wasm @crossbind/port-curl-android @crossbind/port-curl-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import curlWasm from '@crossbind/port-curl-wasm/crossbind.config.js';
+import curlAndroid from '@crossbind/port-curl-android/crossbind.config.js';
+import curlIos from '@crossbind/port-curl-ios/crossbind.config.js';

export default {
    dependencies: [
+        curlWasm,
+        curlAndroid,
+        curlIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use CURL in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <curl/curl.h>

std::string Native::sample() {
+    return std::string(curl_version());
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@crossbind/port-curl-wasm`](https://www.npmjs.com/package/@crossbind/port-curl-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-curl-android`](https://www.npmjs.com/package/@crossbind/port-curl-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-curl-ios`](https://www.npmjs.com/package/@crossbind/port-curl-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled libcurl library, which is distributed under the [curl License](https://github.com/curl/curl/blob/master/COPYING).

CURL Homepage: [https://curl.se/](https://curl.se/)
