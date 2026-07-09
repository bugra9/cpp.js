import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import CppjsWebpackPlugin from '@cpp.js/plugin-webpack';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14'];

const cppjsWebpackPlugin = new CppjsWebpackPlugin();
const cppjsLoaderOptions = cppjsWebpackPlugin.getLoaderOptions();

export default defineConfig({
    context: __dirname,
    entry: {
        main: './src/main.jsx',
    },
    resolve: {
        extensions: ['...', '.ts', '.tsx', '.jsx'],
    },
    module: {
        rules: [
            {
                test: /\.h$/,
                loader: '@cpp.js/plugin-webpack-loader',
                options: { ...cppjsLoaderOptions },
            },
            {
                test: /\.svg$/,
                type: 'asset',
            },
            {
                test: /\.css$/,
                type: 'css/auto',
            },
            {
                test: /\.(jsx?|tsx?)$/,
                use: [
                    {
                        loader: 'builtin:swc-loader',
                        options: {
                            jsc: {
                                parser: {
                                    syntax: 'typescript',
                                    tsx: true,
                                },
                                transform: {
                                    react: {
                                        runtime: 'automatic',
                                        development: isDev,
                                        refresh: isDev,
                                    },
                                },
                            },
                            env: { targets },
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        cppjsWebpackPlugin,
        new rspack.HtmlRspackPlugin({
            template: './index.html',
        }),
        isDev ? new ReactRefreshRspackPlugin() : null,
    ].filter(Boolean),
    optimization: {
        minimizer: [
            new rspack.SwcJsMinimizerRspackPlugin(),
            new rspack.LightningCssMinimizerRspackPlugin({
                minimizerOptions: { targets },
            }),
        ],
    },
    devServer: {
        watchFiles: {
            paths: ['src/**/*'], // İzlemek istediğiniz dosya/dizin
            options: {
                ignored: /node_modules/, // İstemediğiniz dosyaları hariç tutabilirsiniz
            },
        },
        hot: true, // HMR'yi etkinleştirir
        liveReload: true, // Sayfa yenileme
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        },
        setupMiddlewares: (middlewares, devServer) => {
            // The plugin helper streams /cpp.js, /cpp.wasm and /cpp.data.txt with
            // plain-Node responses; res.sendFile/res.send are Express-only and do
            // not exist on @rspack/dev-server 2 middlewares.
            return cppjsWebpackPlugin.setDevServerMiddleware(middlewares, devServer);
        },
    },
});
