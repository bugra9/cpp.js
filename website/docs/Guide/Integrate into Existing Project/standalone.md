# Standalone

:::info
If you are using a bundler, you may choose to skip this section.
:::

You can use cpp.js to compile native code from your project into WebAssembly. To do this, add the build script and cpp.js as a dependency in the package.json file of your project.

```diff title="package.json"
{
    "name": "myapp",
    "scripts": {
+       "build": "cpp.js build -p wasm"
    },
    "devDependencies": {
+       "cpp.js": "^1.0.0-beta.1"
    }
}
```

To install the npm packages, use the following command:
```shell npm2yarn
npm install
```

Cpp.js requires a configuration file to work. For a minimal setup, create a `cppjs.config.mjs` file and add the following content.

```js title="cppjs.config.mjs"
import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    paths: {
        project: getDirName(import.meta.url),
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

#endif
```

Now, we can compile our C++ code into WebAssembly. Run the following command:
:::warning
Before proceeding, ensure that you have met all the [prerequisites](/docs/Guide/Getting%20Started/prerequisites) for setting up a working development environment.
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

You can now access your native code by importing **dist/myapp.browser.js** into your JavaScript file. For a minimal setup, create a index.html and add the following content.

```html title="index.html"
<!DOCTYPE html>
<html>
   <head>
      <meta charset = "utf-8">
      <title>Cpp.js Vanilla sample</title>
      <script src="./dist/myapp.browser.js"></script>
      <script>
        initCppJs({ path: './dist' }).then(({ MySampleClass }) => {
            document.querySelector('#cppMessage').innerHTML = MySampleClass.sample();
        });
      </script>
   </head>
   <body>
    <p>Response from c++ : <span id="cppMessage">compiling ...</span></p>
   </body>
</html>
```

To view the output, you can start a local server, such as using the `serve` command, within the project directory.

:::tip
To add `serve` as a project dependency, follow these steps:
```diff title="package.json"
{
    "name": "myapp",
    "scripts": {
+      "start": "serve",
       "build": "cpp.js build -p wasm",
    },
    "devDependencies": {
+      "serve": "^14.2.3",
       "cpp.js": "^1.0.0-beta.1"
    }
}
```
To start your project
```shell npm2yarn
npm run start
```
:::

:::info
**Sample Source Code:** You can access the sample source code from [this link](https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-web-vanilla).
:::
