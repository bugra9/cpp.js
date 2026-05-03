# @cpp.js/package-zstd
**Precompiled zstd (Zstandard) library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@cpp.js/package-zstd">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-zstd?style=for-the-badge" />
</a>
<a href="https://github.com/facebook/zstd">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-zstd%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=ZSTD" />
</a>
<a href="https://github.com/facebook/zstd/blob/dev/LICENSE">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-zstd?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-zstd
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import zstd from '@cpp.js/package-zstd/cppjs.config.js';

export default {
    dependencies: [
+        zstd
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the zstd in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <zstd.h>

std::string Native::sample() {
+    return ZSTD_versionString();
}
```

## License
This project includes the precompiled zstd library, which is distributed under the
[zstd License](https://github.com/facebook/zstd/blob/dev/LICENSE).

zstd Homepage: [https://facebook.github.io/zstd/](https://facebook.github.io/zstd/)
