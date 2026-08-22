# @crossbind/port-openssl
**Precompiled OpenSSL library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-openssl">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-openssl?style=for-the-badge" />
</a>
<a href="https://github.com/openssl/openssl">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-openssl%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=openssl" />
</a>
<a href="https://github.com/openssl/openssl/blob/master/LICENSE.txt">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-openssl?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-openssl @crossbind/port-openssl-wasm @crossbind/port-openssl-android @crossbind/port-openssl-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import opensslWasm from '@crossbind/port-openssl-wasm/crossbind.config.js';
+import opensslAndroid from '@crossbind/port-openssl-android/crossbind.config.js';
+import opensslIos from '@crossbind/port-openssl-ios/crossbind.config.js';

export default {
    dependencies: [
+        opensslWasm,
+        opensslAndroid,
+        opensslIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use OpenSSL in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <openssl/opensslv.h>

std::string Native::sample() {
+    return std::string(OPENSSL_FULL_VERSION_STR);
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@crossbind/port-openssl-wasm`](https://www.npmjs.com/package/@crossbind/port-openssl-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-openssl-android`](https://www.npmjs.com/package/@crossbind/port-openssl-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-openssl-ios`](https://www.npmjs.com/package/@crossbind/port-openssl-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled OpenSSL library, which is distributed under the [Apache License 2.0](https://github.com/openssl/openssl/blob/master/LICENSE.txt).

OpenSSL Homepage: [https://openssl.se/](https://openssl.se/)
