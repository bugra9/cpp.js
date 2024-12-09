# @cpp.js/package-webp
**Precompiled webp library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-webp">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-webp?style=for-the-badge" />
</a>
<a href="https://chromium.googlesource.com/webm/libwebp/+/refs/heads/main/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-webp?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-webp
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import webp from '@cpp.js/package-webp/cppjs.config.js';

export default {
    dependencies: [
+        webp
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the webp in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <webp/decode.h>

std::string Native::sample() {
+    return std::to_string(WebPGetDecoderVersion());
}
```

## License
This project includes the precompiled webp library, which is distributed under the [BSD 3-Clause License](https://chromium.googlesource.com/webm/libwebp/+/refs/heads/main/COPYING).

WebP Homepage: <https://developers.google.com/speed/webp>
