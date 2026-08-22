# @crossbind/port-iconv
**Precompiled libiconv (character encoding conversion) library built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-iconv">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-iconv?style=for-the-badge" />
</a>
<a href="https://www.gnu.org/software/libiconv/">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-iconv%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=iconv" />
</a>
<a href="https://spdx.org/licenses/LGPL-2.1-or-later.html">
    <img alt="License" src="https://img.shields.io/npm/l/%40crossbind%2Fpackage-iconv?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-iconv @crossbind/port-iconv-wasm @crossbind/port-iconv-android @crossbind/port-iconv-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import iconvWasm from '@crossbind/port-iconv-wasm/crossbind.config.js';
+import iconvAndroid from '@crossbind/port-iconv-android/crossbind.config.js';
+import iconvIos from '@crossbind/port-iconv-ios/crossbind.config.js';

export default {
    dependencies: [
+        iconvWasm,
+        iconvAndroid,
+        iconvIos,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use iconv in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <iconv.h>

std::string Native::sample() {
+    return to_string(_LIBICONV_VERSION);
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@crossbind/port-iconv-wasm`](https://www.npmjs.com/package/@crossbind/port-iconv-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-iconv-android`](https://www.npmjs.com/package/@crossbind/port-iconv-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-iconv-ios`](https://www.npmjs.com/package/@crossbind/port-iconv-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled libiconv library, which is distributed under the [LGPL License](https://spdx.org/licenses/LGPL-2.1-or-later.html).

iconv Homepage: [https://www.gnu.org/software/libiconv/](https://www.gnu.org/software/libiconv/)
