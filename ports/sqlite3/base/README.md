# @crossbind/port-sqlite3
**Precompiled SQLite3 database engine built with crossbind for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@crossbind/port-sqlite3">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/port-sqlite3?style=for-the-badge" />
</a>
<a href="https://www.sqlite.org/">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40crossbind%2Fpackage-sqlite3%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=SQLite" />
</a>
<a href="https://www.sqlite.org/copyright.html">
    <img alt="License" src="https://img.shields.io/badge/license-Public%20Domain-blue?style=for-the-badge" />
</a>

> Use it together with **[crossbind](https://crossbind.dev)** — the toolchain for using C++ libraries from JavaScript, TypeScript, WebAssembly, Node.js and React Native. Learn more at **[crossbind.dev](https://crossbind.dev)**.

## Integration
Install the main package together with the platform builds:

```sh
npm install @crossbind/port-sqlite3 @crossbind/port-sqlite3-wasm @crossbind/port-sqlite3-android @crossbind/port-sqlite3-ios
```

Then import all three platforms in `crossbind.config.js` — crossbind compiles only the one matching each build target:

```diff
+import sqlite3Wasm from '@crossbind/port-sqlite3-wasm/crossbind.config.js';
+import sqlite3Android from '@crossbind/port-sqlite3-android/crossbind.config.js';
+import sqlite3Ios from '@crossbind/port-sqlite3-ios/crossbind.config.js';

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
| WebAssembly | [`@crossbind/port-sqlite3-wasm`](https://www.npmjs.com/package/@crossbind/port-sqlite3-wasm) | `wasm32` — single-threaded & multi-threaded |
| Android | [`@crossbind/port-sqlite3-android`](https://www.npmjs.com/package/@crossbind/port-sqlite3-android) | `arm64-v8a` (64-bit ARM), `x86_64` (emulator) |
| iOS | [`@crossbind/port-sqlite3-ios`](https://www.npmjs.com/package/@crossbind/port-sqlite3-ios) | device (`arm64`), simulator (`arm64`) |

## License
This project includes the precompiled SQLite3 library, which is released into the [public domain](https://www.sqlite.org/copyright.html).

SQLite Homepage: [https://www.sqlite.org/](https://www.sqlite.org/)
