// @ts-check
import fs from 'node:fs';
import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import { ReactRefreshRspackPlugin } from '@rspack/plugin-react-refresh';
import CppjsWebpackPlugin from '@cpp.js/plugin-webpack';

const isDev = process.env.NODE_ENV === 'development';

const cppjsWebpackPlugin = new CppjsWebpackPlugin();
const cppjsLoaderOptions = cppjsWebpackPlugin.getLoaderOptions();
const { state, getTargetParams, getFilteredBuildTargets } = cppjsLoaderOptions;

const targetParams = getTargetParams({ platform: ['wasm'], arch: ['wasm32'], runtime: ['st'], runtimeEnv: ['browser'] }, true);
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
    entry: {
        main: './src/main.jsx',
    },
    target: ['browserslist:last 2 versions, > 0.2%, not dead, Firefox ESR'],
    resolve: {
        extensions: ['...', '.jsx'],
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
                test: /\.(?:js|jsx|mjs|cjs)$/,
                use: [
                    {
                        loader: 'builtin:swc-loader',
                        /** @type {import('@rspack/core').SwcLoaderOptions} */
                        options: {
                            detectSyntax: 'auto',
                            jsc: {
                                transform: {
                                    react: {
                                        runtime: 'automatic',
                                        development: isDev,
                                        refresh: isDev,
                                    },
                                },
                            },
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
        isDev && new ReactRefreshRspackPlugin(),
    ],
    devServer: {
        watchFiles: {
            paths: ['src/**/*'],
            options: {
                ignored: /node_modules/,
            },
        },
        hot: true,
        liveReload: true,
        setupMiddlewares: (middlewares, devServer) => {
            if (!devServer) {
                throw new Error('@rspack/dev-server is not defined');
            }

            middlewares.unshift({
                name: '/cpp.js',
                path: '/cpp.js',
                middleware: (req, res) => {
                    const filePath = `${state.config.paths.build}/${buildTargetDebug.jsName}`;
                    res.setHeader('Content-Type', 'application/javascript');
                    fs.createReadStream(filePath).pipe(res);
                },
            });

            middlewares.unshift({
                name: '/cpp.wasm',
                path: '/cpp.wasm',
                middleware: (req, res) => {
                    const filePath = `${state.config.paths.build}/${buildTargetDebug.wasmName}`;
                    res.setHeader('Content-Type', 'application/wasm');
                    fs.createReadStream(filePath).pipe(res);
                },
            });

            return middlewares;
        },
    },
});
