async function cppjsLoader(content) {
    const compiler = this.getOptions().compiler;
    compiler.findOrCreateInterfaceFile(this.resourcePath);

    return 'export default function() { return new Promise((resolve, reject) => import(/* webpackIgnore: true */ "/cpp.js").then(n => n.default(resolve))); }';
}

module.exports = cppjsLoader;
