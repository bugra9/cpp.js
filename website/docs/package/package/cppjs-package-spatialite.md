# @cpp.js/package-spatialite
**Precompiled spatialite library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-spatialite">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-spatialite?style=for-the-badge" />
</a>
<a href="https://www.gaia-gis.it/fossil/libspatialite/index">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-spatialite%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=SpatiaLite" />
</a>
<a href="https://website-archive.mozilla.org/www.mozilla.org/mpl/MPL/boilerplate-1.1/mpl-tri-license-html">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-spatialite?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-spatialite
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import spatialite from '@cpp.js/package-spatialite/cppjs.config.js';

export default {
    dependencies: [
+        spatialite
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the spatialite in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <spatialite.h>

std::string Native::sample() {
+    return std::string(spatialite_version());
}
```

## License
This project includes the precompiled spatialite library, which is distributed under the [MPL tri-license](https://website-archive.mozilla.org/www.mozilla.org/mpl/MPL/boilerplate-1.1/mpl-tri-license-html).

Spatialite Homepage: [https://www.gaia-gis.it/fossil/libspatialite/index](https://www.gaia-gis.it/fossil/libspatialite/index)
