async function cppjsLoader(content) {
    const options = this.getOptions();
    const p = await import('path');
    const basePath = options.basePath ? p.resolve(options.basePath) : process.cwd();

    const { createBridge, findCMakeListsFile, findOrCreateInterfaceFile, createWasm } = await import('cpp.js');
    const interfaceFile = findOrCreateInterfaceFile(this.resourcePath, options.tempDir, basePath);
    createBridge(interfaceFile, options.tempDir, basePath);

    return 'export default function() { return new Promise((resolve, reject) => import(/* webpackIgnore: true */ "/cpp.js").then(n => n.default(resolve))); }';
}

module.exports = cppjsLoader;
