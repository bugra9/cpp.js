import fs from 'fs';
import p from 'path';
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
        const basePath = this.options.basePath ? p.resolve(this.options.basePath) : process.cwd();
        const isDev = compilation.options.mode === 'development';
        const outputPath = isDev ? this.options.tempDir : compilation.options.output.path;
        const cMakeListsFilePath = findCMakeListsFile();
        createWasm(cMakeListsFilePath, outputPath, this.options.tempDir, { cc: ['-O3'] }, basePath);
        if (!isDev && this.options.tempDir) {
            fs.rmSync(this.options.tempDir, { recursive: true, force: true });
        }
    }
}
