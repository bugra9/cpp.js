async function cppjsLoader() {
    const {
        bridges, createBridgeFile, getCppJsScript, getRustJsScript, state,
    } = this.getOptions();
    const target = state.targets.find((t) => t.platform === 'wasm');

    // Rust surfaces need no C++ bridge file: the native bridge is the generated companion
    // crate; this only emits the JS proxy module - the same shape as the .h flow.
    if (this.resourcePath.endsWith('.rs')) {
        return getRustJsScript(target, this.resourcePath);
    }

    const bridgeFile = createBridgeFile(this.resourcePath);
    bridges.push(bridgeFile);

    return getCppJsScript(target, bridgeFile);
}

module.exports = cppjsLoader;
