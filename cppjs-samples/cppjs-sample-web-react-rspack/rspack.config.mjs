import { dirname } from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import RefreshPlugin from '@rspack/plugin-react-refresh';
import CppjsWebpackPlugin from '@cpp.js/plugin-webpack';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

// Target browsers, see: https://github.com/browserslist/browserslist
const targets = ['chrome >= 87', 'edge >= 88', 'firefox >= 78', 'safari >= 14'];

const cppjsWebpackPlugin = new CppjsWebpackPlugin();
const cppjsLoaderOptions = cppjsWebpackPlugin.getLoaderOptions();
const { state, getTargetParams, getFilteredBuildTargets } = cppjsLoaderOptions;

const targetParams = getTargetParams({ platform: 'wasm', arch: 'wasm32', runtime: 'st', runtimeEnv: 'browser' }, true);
let buildTargetRelease = getFilteredBuildTargets(targetParams, { buildType: 'release' })?.[0];
let buildTargetDebug = getFilteredBuildTargets(targetParams, { buildType: 'debug' })?.[0];

if (!buildTargetRelease && !buildTargetDebug) {
    throw new Error('No build targets found');
}

if (!buildTargetDebug) {
    buildTargetDebug = buildTargetRelease;
} else if (!buildTargetRelease) {
    buildTargetRelease = buildTargetDebug;
}

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
        isDev ? new RefreshPlugin() : null,
    ].filter(Boolean),
    optimization: {
        minimizer: [
            new rspack.SwcJsMinimizerRspackPlugin(),
            new rspack.LightningCssMinimizerRspackPlugin({
                minimizerOptions: { targets },
            }),
        ],
    },
    experiments: {
        css: true,
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
        setupMiddlewares: (middlewares, devServer) => {
            if (!devServer) {
                throw new Error('@rspack/dev-server is not defined');
            }

            middlewares.unshift({
                name: '/cpp.js',
                path: '/cpp.js',
                middleware: (req, res) => {
                    res.sendFile(`${state.config.paths.build}/${buildTargetDebug.jsName}`);
                },
            });
            middlewares.unshift({
                name: '/cpp.wasm',
                path: '/cpp.wasm',
                middleware: (req, res) => {
                    res.send(fs.readFileSync(`${state.config.paths.build}/${buildTargetDebug.wasmName}`));
                },
            });

            return middlewares;
        },
    },
});
