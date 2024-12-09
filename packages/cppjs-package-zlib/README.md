# @cpp.js/package-zlib
**Precompiled zlib library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-zlib">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-zlib?style=for-the-badge" />
</a>
<a href="https://zlib.net/zlib_license.html">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-zlib?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-zlib
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import zlib from '@cpp.js/package-zlib/cppjs.config.js';

export default {
    dependencies: [
+        zlib
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the zlib in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <zlib.h>

std::string Native::sample() {
+    return std::string(zlibVersion());
}
```

## License
This project includes the precompiled zlib library, which is distributed under the [zlib License](https://zlib.net/zlib_license.html).

Zlib Homepage: <https://zlib.net/>
