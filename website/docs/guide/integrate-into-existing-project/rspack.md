# Rspack

To integrate cpp.js into your project using Rspack as a bundler, you can utilize the cppjs-webpack-plugin and cppjs-loader plugins. Start by installing these packages with the following command:

```shell npm2yarn
npm install cppjs-webpack-plugin cppjs-loader --save-dev
```

To enable the plugin, modify the `rspack.config.mjs` file as shown below.

```diff title="rspack.config.mjs"
+ import CppjsWebpackPlugin from 'cppjs-webpack-plugin';

+ const cppjsWebpackPlugin = new CppjsWebpackPlugin();
+ const compiler = cppjsWebpackPlugin.getCompiler();

export default defineConfig({
	module: {
		rules: [
+            {
+                test: /\.h$/,
+                loader: 'cppjs-loader',
+                options: { compiler },
+            }
		]
	},
	plugins: [
+         cppjsWebpackPlugin,
	].filter(Boolean),
+     devServer: {
+         watchFiles: compiler.config.paths.native,
+         setupMiddlewares: (middlewares, devServer) => {
+             if (!devServer) {
+                 throw new Error('@rspack/dev-server is not defined');
+             }
+ 
+             middlewares.unshift({
+                 name: '/cpp.js',
+                 path: '/cpp.js',
+                 middleware: (req, res) => {
+                     res.sendFile(`${compiler.config.paths.temp}/${compiler.config.general.name}.browser.js`);
+                 },
+             });
+             middlewares.unshift({
+                 name: '/cpp.wasm',
+                 path: '/cpp.wasm',
+                 middleware: (req, res) => {
+                     res.send(fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`));
+                 },
+             });
+ 
+             return middlewares;
+         },
+     },
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

:::info
**Sample Source Code:** You can access the sample source code from [this link](https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-web-react-rspack).
:::
