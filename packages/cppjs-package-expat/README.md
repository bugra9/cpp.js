# @cpp.js/package-expat
**Precompiled expat library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-expat">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-expat?style=for-the-badge" />
</a>
<a href="https://github.com/libexpat/libexpat/blob/master/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-expat?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-expat
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import expat from '@cpp.js/package-expat/cppjs.config.js';

export default {
    dependencies: [
+        expat
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the expat in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <expat.h>

std::string Native::sample() {
+    return std::string(XML_ExpatVersion());
}
```

## License
This project includes the precompiled expat library, which is distributed under the [MIT License](https://github.com/libexpat/libexpat/blob/master/COPYING).

Expat Homepage: <https://github.com/libexpat/libexpat>
