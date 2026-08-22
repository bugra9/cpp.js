# @crossbind/port-zstd
**Precompiled Zstandard (zstd) library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-zstd">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-zstd?style=for-the-badge" />
</a>
<a href="https://github.com/facebook/zstd">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-zstd%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=ZSTD" />
</a>
<a href="https://github.com/facebook/zstd/blob/dev/LICENSE">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-zstd?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-zstd @crossbind/port-zstd-wasm @crossbind/port-zstd-android @crossbind/port-zstd-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import zstdWasm from '@crossbind/port-zstd-wasm/crossbind.config.js';
+import zstdAndroid from '@crossbind/port-zstd-android/crossbind.config.js';
+import zstdIos from '@crossbind/port-zstd-ios/crossbind.config.js';

export default {
    dependencies: [
+        zstdWasm,
+        zstdAndroid,
+        zstdIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use zstd in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <zstd.h>

std::string Native::sample() {
+    return ZSTD_versionString();
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@crossbind/port-zstd-wasm`](https://www.npmjs.com/package/@crossbind/port-zstd-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-zstd-android`](https://www.npmjs.com/package/@crossbind/port-zstd-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-zstd-ios`](https://www.npmjs.com/package/@crossbind/port-zstd-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled zstd library, which is distributed under the [zstd License](https://github.com/facebook/zstd/blob/dev/LICENSE).

zstd Homepage: [https://facebook.github.io/zstd/](https://facebook.github.io/zstd/)
