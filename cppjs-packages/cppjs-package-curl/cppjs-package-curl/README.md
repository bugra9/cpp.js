# @cpp.js/package-curl
**Precompiled libcurl (CURL) library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@cpp.js/package-curl">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-curl?style=for-the-badge" />
</a>
<a href="https://github.com/curl/curl">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-curl%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=curl" />
</a>
<a href="https://github.com/curl/curl/blob/master/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-curl?style=for-the-badge" />
</a>

> Use it together with **[cpp.js](https://cpp.js.org)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[cpp.js.org](https://cpp.js.org)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @cpp.js/package-curl @cpp.js/package-curl-wasm @cpp.js/package-curl-android @cpp.js/package-curl-ios
```

Then import all three platforms in `cppjs.config.js` — cpp.js compiles only the one matching each build target:

```diff
+import curlWasm from '@cpp.js/package-curl-wasm/cppjs.config.js';
+import curlAndroid from '@cpp.js/package-curl-android/cppjs.config.js';
+import curlIos from '@cpp.js/package-curl-ios/cppjs.config.js';

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
| WebAssembly | [`@cpp.js/package-curl-wasm`](https://www.npmjs.com/package/@cpp.js/package-curl-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@cpp.js/package-curl-android`](https://www.npmjs.com/package/@cpp.js/package-curl-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@cpp.js/package-curl-ios`](https://www.npmjs.com/package/@cpp.js/package-curl-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled libcurl library, which is distributed under the [curl License](https://github.com/curl/curl/blob/master/COPYING).

CURL Homepage: [https://curl.se/](https://curl.se/)
