# @cpp.js/package-proj
**Precompiled proj library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-proj">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-proj?style=for-the-badge" />
</a>
<a href="https://github.com/OSGeo/PROJ">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-proj%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=PROJ" />
</a>
<a href="https://github.com/OSGeo/PROJ/blob/master/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-proj?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-proj
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import proj from '@cpp.js/package-proj/cppjs.config.js';

export default {
    dependencies: [
+        proj
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the proj in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <proj.h>

double Native::sample() {
+    return proj_torad(15.6);
}
```

## License
This project includes the precompiled proj library, which is distributed under the [MIT License](https://github.com/OSGeo/PROJ/blob/master/COPYING).

Proj Homepage: <https://proj.org/>
