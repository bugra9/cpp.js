# @cpp.js/package-geos
**Precompiled geos library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-geos">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-geos?style=for-the-badge" />
</a>
<a href="https://github.com/OSGeo/libgeotiff/blob/master/libgeotiff/LICENSE">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-geos?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-geos
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import geos from '@cpp.js/package-geos/cppjs.config.js';

export default {
    dependencies: [
+        geos
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the geos in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <geos_c.h>

std::string Native::sample() {
+    return std::string(GEOSversion());
}
```

## License
This project includes the precompiled geos library, which is distributed under the [LGPL License](https://github.com/OSGeo/libgeotiff/blob/master/libgeotiff/LICENSE).

GEOS Homepage: <https://github.com/libgeos/geos>
