async function cppjsLoader() {
    const { bridges, createBridgeFile, getCppJsScript, state } = this.getOptions();

    const bridgeFile = createBridgeFile(this.resourcePath);
    bridges.push(bridgeFile);

    return getCppJsScript(state.targets.find((t) => t.platform === 'wasm'), bridgeFile);
}

module.exports = cppjsLoader;
