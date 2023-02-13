const p = require('path');
const fs = require('fs');

function createTempDir(folder) {
    let path = p.join(process.cwd(), 'node_modules', ".cppjs");
    if (folder) path = p.join(path, folder);

    if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true });
    fs.mkdirSync(path, { recursive: true });

    return path;
}

module.exports = async function () {
    const { default: CppjsWebpackPlugin } = await import('cppjs-webpack-plugin');
    const tempDir = createTempDir('a' + Math.random());
    return {
        webpack: {
            plugins: {
                add: [new CppjsWebpackPlugin({ tempDir, basePath: '../..' })],
            },
            configure: (config) => {
                config.module.rules[1].oneOf = [
                    {
                        test: /\.h$/,
                        loader: 'cppjs-loader',
                        options: { tempDir, basePath: '../..' }
                    },
                    ...config.module.rules[1].oneOf,
                ];
                return config;
            },
        },
        devServer: (devServerConfig) => {
            devServerConfig.onBeforeSetupMiddleware = (devServer) => {
                if (!devServer) {
                  throw new Error('webpack-dev-server is not defined');
                }

                devServer.app.get('/cpp.js', function (req, res) {
                  res.sendFile(`${tempDir}/cpp.js`);
                });

                devServer.app.get('/cpp.wasm', function (req, res) {
                    res.send(fs.readFileSync(`${tempDir}/cpp.wasm`));
                });
            };

            return devServerConfig;
        },
    };
};
