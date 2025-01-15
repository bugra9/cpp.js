# @cpp.js/package-sqlite3
**Precompiled sqlite3 library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-sqlite3">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-sqlite3?style=for-the-badge" />
</a>
<a href="https://www.sqlite.org">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-sqlite3%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=SQLite" />
</a>
<a href="https://www.sqlite.org/copyright.html">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-sqlite3?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-sqlite3
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import sqlite3 from '@cpp.js/package-sqlite3/cppjs.config.js';

export default {
    dependencies: [
+        sqlite3
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the sqlite3 in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <sqlite3.h>

std::string Native::sample() {
+    return std::string(sqlite3_libversion());
}
```

## License
This project includes the precompiled sqlite3 library, which is distributed under the [Public Domain License](https://www.sqlite.org/copyright.html).

Sqlite3 Homepage: [https://www.sqlite.org](https://www.sqlite.org)
