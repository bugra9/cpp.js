# CRA (Create React App)
Create React App (CRA) uses a predefined Webpack configuration that doesn't allow direct modifications. To customize it, we can use CRACO (Create React App Configuration Override). Start by installing these packages with the following command:

```shell npm2yarn
npm install @craco/craco @cpp.js/webpack-plugin @cpp.js/webpack-plugin-loader
```

To enable the CRACO, modify the `package.json` file as shown below.

```diff title="package.json"
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

To enable the plugin, create the `craco.config.js` file as shown below.

```js  title="craco.config.js"
const fs = require('fs');

module.exports = async function () {
    const { default: CppjsWebpackPlugin } = await import('@cpp.js/webpack-plugin');
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
                        loader: '@cpp.js/webpack-plugin-loader',
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

Cpp.js requires a configuration file to work. For a minimal setup, create a `cppjs.config.mjs` file and add the following content.

```js title="cppjs.config.mjs"
export default {
    paths: {
        config: import.meta.url,
    },
};
```

The project is now fully set up and ready to run.

:::warning
Before proceeding, ensure that you have met all the [prerequisites](/docs/guide/getting-started/prerequisites) for setting up a working development environment.
:::
