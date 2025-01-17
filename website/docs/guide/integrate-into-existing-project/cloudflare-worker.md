# Cloudflare Worker

You can use cpp.js to compile native code from your project into WebAssembly. To do this, add the build script and cpp.js as a dependency in the package.json file of your project.

```diff title="package.json"
{
    "name": "myapp",
    "scripts": {
+       "build": "cppjs build -p WebAssembly",
        "dev": "wrangler dev",
        "deploy": "wrangler dev"
    },
    "devDependencies": {
+       "cpp.js": "^1.0.0",
        "wrangler": "^3.75.0"
    }
}
```

To install the npm packages, use the following command:
```shell npm2yarn
npm install
```

Cpp.js requires a configuration file to work. For a minimal setup, create a `cppjs.config.mjs` file and add the following content.

```js title="cppjs.config.mjs"
export default {
    paths: {
        config: import.meta.url,
        output: 'dist',
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

Now, we can compile our C++ code into WebAssembly. Run the following command:
:::warning
Before proceeding, ensure that you have met all the [prerequisites](/docs/guide/getting-started/prerequisites) for setting up a working development environment.
:::
```shell npm2yarn
npm run build
```

This command will generate myapp.wasm, myapp.browser.js, and myapp.node.js files inside the dist folder.

```
├── src
│   └── native
|       └── MySampleClass.h
|
├── dist
│   └── myapp.wasm
|   └── myapp.browser.js
|   └── myapp.node.js
├── ...
```

You can now access your native code by importing **dist/myapp.browser.js** into your JavaScript file. For a minimal setup, create a index.js and add the following content.

```js title="index.js"
import initCppJs from './dist/myapp.browser.js';
import wasmContent from './dist/myapp.wasm';

const { MySampleClass } = await initCppJs({ getWasmFunction: () => wasmContent });

export default {
    async fetch(request, env, ctx) {
        return new Response(MySampleClass.sample());
    },
};
```

The project is now fully set up and ready to run. To view the output, run the following command:

```shell npm2yarn
npm run dev
```

To deploy the output, run the following command:

```shell npm2yarn
npm run deploy
```

:::info
**Sample Source Code:** You can access the sample source code from [this link](https://github.com/bugra9/cpp.js/tree/main/packages/cppjs-sample-cloud-cloudflare-worker).
:::
