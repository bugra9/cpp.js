import fs from 'fs';
import p from 'path';
import CppjsCompiler from 'cpp.js';

export default class CppjsWebpackPlugin {
    static defaultOptions = {};

    constructor(options = {}) {
        this.options = { ...CppjsWebpackPlugin.defaultOptions, ...options };
        this.compiler = new CppjsCompiler();
    }

    apply(compiler) {
        const pluginName = this.constructor.name;
        compiler.hooks.done.tap(pluginName, this.onDone.bind(this));
        compiler.hooks.afterCompile.tapAsync(pluginName, this.afterCompile.bind(this));
    }

    afterCompile(compilation, callback) {
        this.compiler.config.paths.native.map(file => compilation.contextDependencies.add(file))
        callback();
    }

    onDone({ compilation }) {
        const isDev = compilation.options.mode === 'development';
        this.compiler.createBridge();
        this.compiler.createWasm({ cc: ['-O3'] });
        if (!isDev) {
            fs.copyFileSync(`${this.compiler.config.paths.temp}/${this.compiler.config.general.name}.js`, `${compilation.options.output.path}/cpp.js`);
            fs.copyFileSync(`${this.compiler.config.paths.temp}/${this.compiler.config.general.name}.wasm`, `${compilation.options.output.path}/cpp.wasm`);
            fs.rmSync(this.compiler.config.paths.temp, { recursive: true, force: true });
        }
    }

    getCompiler() {
        return this.compiler;
    }
}
