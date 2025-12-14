# @cpp.js/package-gdal
**Precompiled gdal library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-gdal">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-gdal?style=for-the-badge" />
</a>
<a href="https://github.com/OSGeo/gdal">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-gdal%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=Gdal" />
</a>
<a href="https://github.com/OSGeo/gdal/blob/master/LICENSE.TXT">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-gdal?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-gdal
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import gdal from '@cpp.js/package-gdal/cppjs.config.js';

export default {
    dependencies: [
+        gdal
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the gdal in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <gdal.h>

std::string Native::sample() {
+    return std::string(GDAL_RELEASE_NAME);
}
```

## License
This project includes the precompiled GDAL library, which is distributed under the [MIT License](https://github.com/OSGeo/gdal/blob/master/LICENSE.TXT).

GDAL Homepage: [https://gdal.org/](https://gdal.org/)
