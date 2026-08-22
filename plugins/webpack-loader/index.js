async function crossbindLoader() {
    const {
        bridges, createBridgeFile, getCrossbindScript, getRustJsScript, state,
    } = this.getOptions();
    const target = state.targets.find((t) => t.platform === 'wasm');

    // Rust surfaces need no C++ bridge file: the native bridge is the generated companion
    // crate; this only emits the JS proxy module - the same shape as the .h flow.
    if (this.resourcePath.endsWith('.rs')) {
        return getRustJsScript(target, this.resourcePath);
    }

    const bridgeFile = createBridgeFile(this.resourcePath);
    bridges.push(bridgeFile);

    return getCrossbindScript(target, bridgeFile);
}

module.exports = crossbindLoader;
