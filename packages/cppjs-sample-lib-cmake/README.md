# @cpp.js/sample-lib-cmake
**Cpp.js sample library: simple cmake library**  

<a href="https://www.npmjs.com/package/@cpp.js/sample-lib-cmake">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/sample-lib-cmake?style=for-the-badge" />
</a>
<a href="https://github.com/bugra9/cpp.js/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/bugra9/cpp.js?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/sample-lib-cmake
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
import getDirName from 'cpp.js/src/utils/getDirName.js';
+import cmakeSample from '@cpp.js/sample-lib-cmake/cppjs.config.js';

export default {
    dependencies: [
+        cmakeSample
    ]
    paths: {
        project: getDirName(import.meta.url),
    },
};
```

## Usage
Below are the steps to use the library in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <cppjs-lib-samplebasic-cmake/samplebasiccmake.h>

std::string Native::sample() {
+    return SampleBasicCmake::sample();
}

```

### Usage in JavaScript Code (web, with plugin)
```js
import { initCppJs } '@cpp.js/sample-lib-cmake/cppjs-lib-samplebasic-cmake/samplebasiccmake.h';

const { SampleBasicCmake } = await initCppJs();
console.log(SampleBasicCmake.sample());
```
