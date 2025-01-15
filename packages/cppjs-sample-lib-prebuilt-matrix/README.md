# @cpp.js/sample-lib-prebuilt-matrix
**Simple matrix multiplier**  

<a href="https://www.npmjs.com/package/@cpp.js/sample-lib-prebuilt-matrix">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/sample-lib-prebuilt-matrix?style=for-the-badge" />
</a>
<a href="https://github.com/bugra9/cpp.js/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/bugra9/cpp.js?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/sample-lib-prebuilt-matrix
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import matrix from '@cpp.js/sample-lib-prebuilt-matrix/cppjs.config.js';

export default {
    dependencies: [
+        matrix
    ]
    paths: {
        config: import.meta.url,
    },
};
```

## Usage
Below are the steps to use the Simple Matrix Multiplier in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <Matrix.h>

std::string Native::sample() {
+    auto firstMatrix = std::make_shared<Matrix>(9, 1);
+    auto secondMatrix = std::make_shared<Matrix>(9, 2);
+    auto resultStr = std::to_string(firstMatrix->multiple(secondMatrix)->get(0));
+    return "J₃ * (2*J₃) = " + resultStr + "*J₃";
}

```

### Usage in JavaScript Code (web, with plugin)
```js
import { initCppJs, Matrix } from '@cpp.js/sample-lib-prebuilt-matrix/Matrix.h';

await initCppJs();
const a = new Matrix(1210000, 1);
const b = new Matrix(1210000, 2);
const result = a.multiple(b);
console.log(result.get(0));
```

### Usage in JavaScript Code (web, without plugin)
```js
import 'node_modules/@cpp.js/sample-lib-prebuilt-matrix/dist/cppjs-sample-lib-prebuilt-matrix.browser.js';

initCppJs({ path: 'node_modules/@cpp.js/sample-lib-prebuilt-matrix/dist' }).then(({ Matrix }) => {
    const a = new Matrix(1210000, 1);
    const b = new Matrix(1210000, 2);
    const result = a.multiple(b);
    console.log(result.get(0));
});
```

### Usage in JavaScript Code (node.js)
```js
import 'node_modules/@cpp.js/sample-lib-prebuilt-matrix/dist/cppjs-sample-lib-prebuilt-matrix.node.js';

initCppJs().then(({ Matrix }) => {
    const a = new Matrix(1210000, 1);
    const b = new Matrix(1210000, 2);
    const result = a.multiple(b);
    console.log(result.get(0));
});
```
