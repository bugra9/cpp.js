async function cppjsLoader() {
    const { bridges, createBridgeFile, getCppJsScript } = this.getOptions();

    const bridgeFile = createBridgeFile(this.resourcePath);
    bridges.push(bridgeFile);

    return getCppJsScript('Emscripten-x86_64', bridgeFile);
}

module.exports = cppjsLoader;
