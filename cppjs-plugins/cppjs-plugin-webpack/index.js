/* eslint-disable object-curly-newline */
import fs from 'node:fs';
import { state, createLib, buildWasm, createBridgeFile, getData, getCppJsScript } from 'cpp.js';

export default class CppjsWebpackPlugin {
    static defaultOptions = {};
    static hasBuilt = false; // Static flag shared across all instances (for Next.js multi-compiler)
    static bridges = []; // Static bridges array shared across all instances

    constructor(options = {}) {
        this.options = { ...CppjsWebpackPlugin.defaultOptions, ...options };
    }

    apply(compiler) {
        const pluginName = this.constructor.name;
        compiler.hooks.done.tap(pluginName, this.onDone.bind(this));
        compiler.hooks.afterCompile.tapAsync(pluginName, this.afterCompile.bind(this));
    }

    afterCompile(compilation, callback) {
        state.config.paths.native.map((file) => compilation.contextDependencies.add(file));
        callback();
    }

    async onDone({ compilation }) {
        const isDev = compilation.options.mode === 'development';

        // In dev mode, skip rebuild if already built (prevents infinite loop)
        // Use static flag to share state across multiple webpack instances (Next.js)
        if (isDev && CppjsWebpackPlugin.hasBuilt) {
            return;
        }

        // In dev mode, defer build until bridges is populated (loader has run)
        // This handles the case where server compilation finishes before client compilation
        if (isDev && CppjsWebpackPlugin.bridges.length === 0) {
            return;
        }

        // Set flag BEFORE building to prevent race conditions with parallel onDone calls
        CppjsWebpackPlugin.hasBuilt = true;



        createLib('Emscripten-x86_64', 'Source', { isProd: true, buildSource: true });
        createLib('Emscripten-x86_64', 'Bridge', { isProd: true, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/commonBridges.cpp`, ...CppjsWebpackPlugin.bridges] });
        await buildWasm('browser', true);

        if (!isDev) {
            const output = state.config.paths.output === state.config.paths.build ? compilation.options.output.path : state.config.paths.output;
            fs.copyFileSync(`${state.config.paths.build}/${state.config.general.name}.browser.js`, `${output}/cpp.js`);
            fs.copyFileSync(`${state.config.paths.build}/${state.config.general.name}.wasm`, `${output}/cpp.wasm`);

            const dataFilePath = `${state.config.paths.build}/${state.config.general.name}.data.txt`;
            if (fs.existsSync(dataFilePath)) {
                fs.copyFileSync(dataFilePath, `${output}/cpp.data.txt`);
            }
            // Copy browser.js for pthread worker support (workers load this file)
            const browserJsPath = `${state.config.paths.build}/${state.config.general.name}.browser.js`;
            if (fs.existsSync(browserJsPath)) {
                fs.copyFileSync(browserJsPath, `${output}/cpp.browser.js`);
            }
        }
    }

    getLoaderOptions() {
        return {
            bridges: CppjsWebpackPlugin.bridges,
            createBridgeFile,
            getData,
            state,
            getCppJsScript,
        };
    }
}
