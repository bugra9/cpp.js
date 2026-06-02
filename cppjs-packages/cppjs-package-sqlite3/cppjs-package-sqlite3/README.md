# @cpp.js/package-sqlite3
**Precompiled SQLite3 database engine built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@cpp.js/package-sqlite3">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-sqlite3?style=for-the-badge" />
</a>
<a href="https://www.sqlite.org/">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-sqlite3%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=SQLite" />
</a>
<a href="https://www.sqlite.org/copyright.html">
    <img alt="License" src="https://img.shields.io/badge/license-Public%20Domain-blue?style=for-the-badge" />
</a>

> Use it together with **[cpp.js](https://cpp.js.org)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[cpp.js.org](https://cpp.js.org)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @cpp.js/package-sqlite3 @cpp.js/package-sqlite3-wasm @cpp.js/package-sqlite3-android @cpp.js/package-sqlite3-ios
```

Then import all three platforms in `cppjs.config.js` — cpp.js compiles only the one matching each build target:

```diff
+import sqlite3Wasm from '@cpp.js/package-sqlite3-wasm/cppjs.config.js';
+import sqlite3Android from '@cpp.js/package-sqlite3-android/cppjs.config.js';
+import sqlite3Ios from '@cpp.js/package-sqlite3-ios/cppjs.config.js';

export default {
    dependencies: [
+        sqlite3Wasm,
+        sqlite3Android,
+        sqlite3Ios,
    ],
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use SQLite3 in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <sqlite3.h>

std::string Native::sample() {
+    return std::string(sqlite3_libversion());
}
```

## Supported platforms
This is the main package; the precompiled binaries are shipped per platform:

| Platform | Package | Targets |
|---|---|---|
| WebAssembly | [`@cpp.js/package-sqlite3-wasm`](https://www.npmjs.com/package/@cpp.js/package-sqlite3-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@cpp.js/package-sqlite3-android`](https://www.npmjs.com/package/@cpp.js/package-sqlite3-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@cpp.js/package-sqlite3-ios`](https://www.npmjs.com/package/@cpp.js/package-sqlite3-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled SQLite3 library, which is released into the [public domain](https://www.sqlite.org/copyright.html).

SQLite Homepage: [https://www.sqlite.org/](https://www.sqlite.org/)
