const fs = require('fs');

module.exports = async function () {
    const { default: CppjsWebpackPlugin } = await import('@cpp.js/plugin-webpack');
    const cppjsWebpackPlugin = new CppjsWebpackPlugin();
    const cppjsLoaderOptions = cppjsWebpackPlugin.getLoaderOptions();
    const { state } = cppjsLoaderOptions;

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
                        options: { ...cppjsLoaderOptions },
                    },
                    ...config.module.rules[1].oneOf,
                ];
                return config;
            },
        },
        devServer: (devServerConfig) => {
            devServerConfig.watchFiles = state.config.paths.native;
            devServerConfig.onBeforeSetupMiddleware = (devServer) => {
                if (!devServer) {
                  throw new Error('webpack-dev-server is not defined');
                }

                devServer.app.get('/cpp.js', function (req, res) {
                  res.sendFile(`${state.config.paths.build}/${state.config.general.name}.browser.js`);
                });

                devServer.app.get('/cpp.wasm', function (req, res) {
                    res.send(fs.readFileSync(`${state.config.paths.build}/${state.config.general.name}.wasm`));
                });
            };

            return devServerConfig;
        },
        eslint: {
            enable: false
        }
    };
};
