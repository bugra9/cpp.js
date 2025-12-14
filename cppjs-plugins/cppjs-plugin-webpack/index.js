/* eslint-disable object-curly-newline */
import fs from 'node:fs';
import { state, createLib, buildWasm, createBridgeFile, getData, getCppJsScript } from 'cpp.js';

export default class CppjsWebpackPlugin {
    static defaultOptions = {};

    constructor(options = {}) {
        this.options = { ...CppjsWebpackPlugin.defaultOptions, ...options };
        this.bridges = [];
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
        createLib('Emscripten-x86_64', 'Source', { isProd: true, buildSource: true });
        createLib('Emscripten-x86_64', 'Bridge', { isProd: true, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/commonBridges.cpp`, ...this.bridges] });
        await buildWasm('browser', true);
        if (!isDev) {
            fs.copyFileSync(`${state.config.paths.build}/${state.config.general.name}.browser.js`, `${compilation.options.output.path}/cpp.js`);
            fs.copyFileSync(`${state.config.paths.build}/${state.config.general.name}.wasm`, `${compilation.options.output.path}/cpp.wasm`);

            const dataFilePath = `${state.config.paths.build}/${state.config.general.name}.data.txt`;
            if (fs.existsSync(dataFilePath)) {
                fs.copyFileSync(dataFilePath, `${compilation.options.output.path}/cpp.data.txt`);
            }
            /* const workerFilePath = `${state.config.paths.build}/${state.config.general.name}.js`;
            if (fs.existsSync(workerFilePath)) {
                fs.copyFileSync(workerFilePath, `${compilation.options.output.path}/cpp.worker.js`);
            } */
        }
    }

    getLoaderOptions() {
        return {
            bridges: this.bridges,
            createBridgeFile,
            getData,
            state,
            getCppJsScript,
        };
    }
}
