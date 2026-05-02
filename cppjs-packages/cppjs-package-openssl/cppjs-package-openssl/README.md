# @cpp.js/package-openssl
**Precompiled OpenSSL library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-openssl">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-openssl?style=for-the-badge" />
</a>
<a href="https://github.com/openssl/openssl">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-openssl%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=openssl" />
</a>
<a href="https://github.com/openssl/openssl/blob/master/LICENSE.txt">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-openssl?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-openssl
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import openssl from '@cpp.js/package-openssl/cppjs.config.js';

export default {
    dependencies: [
+        openssl
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the OpenSSL in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <openssl/opensslv.h>

std::string Native::sample() {
+    return std::string(OPENSSL_FULL_VERSION_STR);
}
```

## License
This project includes the precompiled OpenSSL library, which is distributed under the [Apache License 2.0 License](https://github.com/openssl/openssl/blob/master/LICENSE.txt).

OpenSSL Homepage: [https://openssl.se/](https://openssl.se/)
