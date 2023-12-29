async function cppjsLoader(content) {
    const compiler = this.getOptions().compiler;
    compiler.findOrCreateInterfaceFile(this.resourcePath);

    return 'export default function() { return new Promise((resolve, reject) => import(/* webpackIgnore: true */ "/cpp.js").then(n => n.default({paths: {wasm: "cpp.wasm"}})).then(resolve)); }';
}

module.exports = cppjsLoader;
