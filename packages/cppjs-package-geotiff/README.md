# @cpp.js/package-geotiff
**Precompiled geotiff library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-geotiff">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-geotiff?style=for-the-badge" />
</a>
<a href="https://github.com/OSGeo/libgeotiff">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-geotiff%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=GeoTIFF" />
</a>
<a href="https://github.com/OSGeo/libgeotiff/blob/master/libgeotiff/LICENSE">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-geotiff?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-geotiff
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import geotiff from '@cpp.js/package-geotiff/cppjs.config.js';

export default {
    dependencies: [
+        geotiff
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the geotiff in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <geotiff.h>

std::string Native::sample() {
+    return to_string(LIBGEOTIFF_VERSION);
}
```

## License
This project includes the precompiled libgeotiff library, which is distributed under the [MIT License](https://github.com/OSGeo/libgeotiff/blob/master/libgeotiff/LICENSE).

GeoTiff Homepage: <https://github.com/OSGeo/libgeotiff>
