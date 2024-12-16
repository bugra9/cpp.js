# @cpp.js/package-tiff
**Precompiled tiff library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-tiff">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-tiff?style=for-the-badge" />
</a>
<a href="https://gitlab.com/libtiff/libtiff">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-tiff%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=TIFF" />
</a>
<a href="https://libtiff.gitlab.io/libtiff/project/license.html">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-tiff?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-tiff
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import tiff from '@cpp.js/package-tiff/cppjs.config.js';

export default {
    dependencies: [
+        tiff
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the tiff in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <tiffio.h>

std::string Native::sample() {
+    return std::string(TIFFGetVersion());
}
```

## License
This project includes the precompiled tiff library, which is distributed under the [libtiff License](https://libtiff.gitlab.io/libtiff/project/license.html).

Tiff Homepage: <https://libtiff.gitlab.io/libtiff/index.html>
