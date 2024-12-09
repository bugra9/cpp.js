# @cpp.js/package-iconv
**Precompiled iconv library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-iconv">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-iconv?style=for-the-badge" />
</a>
<a href="https://spdx.org/licenses/LGPL-2.1-or-later.html">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-iconv?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-iconv
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import iconv from '@cpp.js/package-iconv/cppjs.config.js';

export default {
    dependencies: [
+        iconv
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the iconv in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <iconv.h>

std::string Native::sample() {
+    return to_string(_LIBICONV_VERSION);
}
```

## License
This project includes the precompiled libiconv library, which is distributed under the [LGPL License](https://spdx.org/licenses/LGPL-2.1-or-later.html).

iconv Homepage: <https://www.gnu.org/software/libiconv/>
