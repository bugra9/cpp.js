# @cpp.js/plugin-webpack-loader
**Cpp.js Webpack loader**  
A tool for seamless C++ integration with the Webpack bundler.

<a href="https://www.npmjs.com/package/@cpp.js/plugin-webpack-loader">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/plugin-webpack-loader?style=for-the-badge" />
</a>
<a href="https://github.com/bugra9/cpp.js/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/bugra9/cpp.js?style=for-the-badge" />
</a>
<a href="https://cpp.js.org/docs/guide/integrate-into-existing-project/webpack">
    <img alt="Docs - React Native" src="https://img.shields.io/badge/Docs_-_Webpack-20B2AA?style=for-the-badge" />
</a>

## Integration
To integrate cpp.js into your project using Webpack as a bundler, you can utilize the @cpp.js/plugin-webpack-loader plugin. Start by installing these package with the following command:

```sh
npm install @cpp.js/plugin-webpack @cpp.js/plugin-webpack-loader --save-dev
```

**Webpack**  
To enable the plugin, modify the `webpack.config.js` file as shown below.

```diff
+ const CppjsWebpackPlugin = require('@cpp.js/plugin-webpack');
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
+       loader: '@cpp.js/plugin-webpack-loader',
+       options: { compiler },
+     }
    ],
  },
};
```

**Rspack**  
To enable the plugin, modify the `rspack.config.mjs` file as shown below.

```diff
+ import CppjsWebpackPlugin from '@cpp.js/plugin-webpack';

+ const cppjsWebpackPlugin = new CppjsWebpackPlugin();
+ const compiler = cppjsWebpackPlugin.getCompiler();

export default defineConfig({
	module: {
		rules: [
+            {
+                test: /\.h$/,
+                loader: '@cpp.js/plugin-webpack-loader',
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

**Craco**  
To enable the plugin, create the `craco.config.js` file as shown below.

```js
const fs = require('fs');

module.exports = async function () {
    const { default: CppjsWebpackPlugin } = await import('@cpp.js/plugin-webpack');
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
                        loader: '@cpp.js/plugin-webpack-loader',
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
                  res.sendFile(`${compiler.config.paths.temp}/${compiler.config.general.name}.browser.js`);
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
