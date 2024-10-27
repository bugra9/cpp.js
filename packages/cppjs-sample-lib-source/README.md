# @cpp.js/sample-lib-source
**Cpp.js sample library: simple source library**  

<a href="https://www.npmjs.com/package/@cpp.js/sample-lib-source">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/sample-lib-source?style=for-the-badge" />
</a>
<a href="https://github.com/bugra9/cpp.js/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/bugra9/cpp.js?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/sample-lib-source
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
import getDirName from 'cpp.js/src/utils/getDirName.js';
+import sourceSample from '@cpp.js/sample-lib-source/cppjs.config.js';

export default {
    dependencies: [
+        sourceSample
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
+#include <cppjs-lib-samplebasic/samplebasic.h>

std::string Native::sample() {
+    return SampleBasic::sample();
}

```

### Usage in JavaScript Code (web, with plugin)
```js
import { initCppJs } '@cpp.js/sample-lib-source/cppjs-lib-samplebasic/samplebasic.h';

const { SampleBasic } = await initCppJs();
console.log(SampleBasic.sample());
```
