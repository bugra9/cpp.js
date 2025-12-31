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
            const output = state.config.paths.output === state.config.paths.build ? compilation.options.output.path : state.config.paths.output;
            fs.copyFileSync(`${state.config.paths.build}/${state.config.general.name}.browser.js`, `${output}/cpp.js`);
            fs.copyFileSync(`${state.config.paths.build}/${state.config.general.name}.wasm`, `${output}/cpp.wasm`);

            const dataFilePath = `${state.config.paths.build}/${state.config.general.name}.data.txt`;
            if (fs.existsSync(dataFilePath)) {
                fs.copyFileSync(dataFilePath, `${output}/cpp.data.txt`);
            }
            /* const workerFilePath = `${state.config.paths.build}/${state.config.general.name}.js`;
            if (fs.existsSync(workerFilePath)) {
                fs.copyFileSync(workerFilePath, `${output}/cpp.worker.js`);
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
