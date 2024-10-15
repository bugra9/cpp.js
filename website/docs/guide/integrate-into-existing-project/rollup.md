# Rollup
:::tip
If you're using the Vite bundler, you can skip this section. Simply follow the instructions provided on the [Vite page](vite).
:::

To integrate cpp.js into your project using Rollup as a bundler, you can utilize the rollup-plugin-cppjs plugin. Start by installing these package with the following command:

```shell npm2yarn
npm install rollup-plugin-cppjs --save-dev
```

To enable the plugin, modify the `vite.config.js` file as shown below.

```diff title="vite.config.js"
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
+ import rollupCppjsPlugin from 'rollup-plugin-cppjs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
+   rollupCppjsPlugin(),
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

#endif
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
