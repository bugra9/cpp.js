---
sidebar_position: 1
---

# React
You can easily integrate cpp.js into your project that uses CRA (Create React App), Webpack or Vite using a plugin.

### CRA (Create React App)
CRA uses self-made webpack config and does not allow editing. We will do it with the help of Craco to edit it.

**Install**

```bash npm2yarn
npm install @craco/craco cppjs-webpack-plugin cppjs-loader
```

**Configuration**

Edit package.json to use _Craco_.

```diff
{
  "scripts": {
-  "start": "react-scripts start"
+  "start": "craco start"
-  "build": "react-scripts build"
+  "build": "craco build"
-  "test": "react-scripts test"
+  "test": "craco test"
  }
}
```


Create _craco.config.js_ file.

```js
const fs = require('fs');

module.exports = async function () {
    const { default: CppjsWebpackPlugin } = await import('cppjs-webpack-plugin');
    const cppjsWebpackPlugin = new CppjsWebpackPlugin();
    const compiler = cppjsWebpackPlugin.getCompiler();

    return {
        webpack: {
            plugins: {
                add: [cppjsWebpackPlugin],
            },
            configure: (config) => {
                config.module.rules[1].oneOf = [
                    {
                        test: /\.h$/,
                        loader: 'cppjs-loader',
                        options: { compiler },
                    },
                    ...config.module.rules[1].oneOf,
                ];
                return config;
            },
        },
        devServer: (devServerConfig) => {
            devServerConfig.watchFiles = compiler.config.paths.native;
            devServerConfig.onBeforeSetupMiddleware = (devServer) => {
                if (!devServer) {
                  throw new Error('webpack-dev-server is not defined');
                }

                devServer.app.get('/cpp.js', function (req, res) {
                  res.sendFile(`${compiler.config.paths.temp}/${compiler.config.general.name}.js`);
                });

                devServer.app.get('/cpp.wasm', function (req, res) {
                    res.send(fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`));
                });
            };

            return devServerConfig;
        },
    };
};
```

### Webpack

**Install**

```bash npm2yarn
npm install cppjs-webpack-plugin cppjs-loader
```

**Configuration**

Add cpp.js plugin to _webpack.config.js_.

```diff
+ const CppjsWebpackPlugin = require('webpack-dashboard/plugin');
+ const cppjsWebpackPlugin = new CppjsWebpackPlugin();
+ const compiler = cppjsWebpackPlugin.getCompiler();

module.exports = {
  //...
  plugins: [
+   cppjsWebpackPlugin,
  ],
  module: {
    rules: [
+     {
+       test: /\.h$/,
+       loader: 'cppjs-loader',
+       options: { compiler },
+     }
    ],
  },
};
```

### Vite

**Install**

```bash npm2yarn
npm install vite-plugin-cppjs
```

**Configuration**

Add cpp.js plugin to _vite.config.js_.

```diff
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
+ import viteCppjsPlugin from 'vite-plugin-cppjs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
+   viteCppjsPlugin(),
  ]
});
```
