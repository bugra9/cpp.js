# Vite

To integrate cpp.js into your project using Vite as a bundler, you can utilize the @cpp.js/plugin-vite plugin. Start by installing these package with the following command:

```shell npm2yarn
npm install @cpp.js/plugin-vite --save-dev
```

To enable the plugin, modify the `vite.config.js` file as shown below.

```diff title="vite.config.js"
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
+ import viteCppjsPlugin from '@cpp.js/plugin-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
+   viteCppjsPlugin(),
  ]
});
```

Cpp.js requires a configuration file to work. For a minimal setup, create a `cppjs.config.mjs` file and add the following content.

```js title="cppjs.config.mjs"
import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    paths: {
        project: getDirName(import.meta.url),
    },
};
```

Move your C++ code to the src/native directory. For example;

```cpp title="src/native/MySampleClass.h"
#pragma once
#include <string>

class MySampleClass {
public:
    static std::string sample() {
        return "Hello World!";
    }
};
```

Modify the JavaScript file to call the C++ function. For example:
```js
import { initCppJs } from './native/native.h'

initCppJs().then(({ MySampleClass }) => {;
  console.log(MySampleClass.sample());
});
```

The project is now fully set up and ready to run.

:::warning
Before proceeding, ensure that you have met all the [prerequisites](/docs/guide/getting-started/prerequisites) for setting up a working development environment.
:::

:::info
**Sample Source Code:** You can access the sample source code from [this link](https://github.com/bugra9/cpp.js/tree/main/packages/cppjs-sample-web-vue-vite).
:::
