async function cppjsLoader(content) {
    const options = this.getOptions();

    const { createBridge, findCMakeListsFile, findOrCreateInterfaceFile, createWasm } = await import('cpp.js');
    const interfaceFile = findOrCreateInterfaceFile(this.resourcePath, options.tempDir);
    createBridge(interfaceFile, options.tempDir);

    return 'export default function() { return new Promise((resolve, reject) => import(/* webpackIgnore: true */ "/cpp.js").then(n => n.default(resolve))); }';
}

module.exports = cppjsLoader;
