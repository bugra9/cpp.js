# @cpp.js/package-jpegturbo
**Precompiled jpegturbo library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-jpegturbo">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-jpegturbo?style=for-the-badge" />
</a>
<a href="https://github.com/libjpeg-turbo/libjpeg-turbo">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-jpegturbo%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=LIBJPEG-TURBO" />
</a>
<a href="https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/LICENSE.md">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-jpegturbo?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-jpegturbo
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import jpeg from '@cpp.js/package-jpegturbo/cppjs.config.js';

export default {
    dependencies: [
+        jpeg
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the jpegturbo in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <jpeglib.h>

std::string Native::sample() {
+    return LIBJPEG_TURBO_VERSION;
}
```

## License
This project includes the precompiled libjpeg-turbo library, which is distributed under the 
[libjpeg-turbo Licenses](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/LICENSE.md).

jpeg-turbo Homepage: [https://libjpeg-turbo.org](https://libjpeg-turbo.org)
