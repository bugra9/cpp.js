# @cpp.js/package-lerc
**Precompiled LERC (Limited Error Raster Compression) library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**

<a href="https://www.npmjs.com/package/@cpp.js/package-lerc">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-lerc?style=for-the-badge" />
</a>
<a href="https://github.com/Esri/lerc">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-lerc%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=LERC" />
</a>
<a href="https://github.com/Esri/lerc/blob/master/LICENSE">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-lerc?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-lerc
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import lerc from '@cpp.js/package-lerc/cppjs.config.js';

export default {
    dependencies: [
+        lerc
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use lerc in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <Lerc_c_api.h>

int Native::sample() {
+    return LERC_VERSION_MAJOR;
}
```

## License
This project includes the precompiled LERC library, which is distributed under the
[LERC License](https://github.com/Esri/lerc/blob/master/LICENSE).

LERC Homepage: [https://github.com/Esri/lerc](https://github.com/Esri/lerc)
