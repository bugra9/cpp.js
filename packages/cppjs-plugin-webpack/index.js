import { createWasm, findCMakeListsFile } from 'cpp.js';

export default class CppjsWebpackPlugin {
    static defaultOptions = {};

    constructor(options = {}) {
        this.options = { ...CppjsWebpackPlugin.defaultOptions, ...options };
    }

    apply(compiler) {
        const pluginName = this.constructor.name;
        compiler.hooks.done.tap(pluginName, this.onDone.bind(this));
    }

    onDone({ compilation }) {
        const isDev = compilation.options.mode === 'development';
        const outputPath = isDev ? this.options.tempDir : compilation.options.output.path;
        const cMakeListsFilePath = findCMakeListsFile();
        createWasm(cMakeListsFilePath, outputPath, this.options.tempDir, { cc: ['-O3'] });
    }
}
