async function cppjsLoader(content) {
    const { bridges, createBridgeFile, getData } = this.getOptions();
    const env = JSON.stringify(getData('env'));

    const params = `{
        ...config,
        env: {...${env}, ...config.env},
        paths: {
            wasm: 'cpp.wasm',
            data: 'cpp.data.txt'
        }
    }`;

    const CppJs = `
export let Native = {};
export function initCppJs(config = {}) {
    return new Promise(
        (resolve, reject) => import(/* webpackIgnore: true */ '/cpp.js').then(n => { return window.CppJs.initCppJs(${params})}).then(m => {
            Native = m;
            resolve(m);
        })
    );
}
`;

    const bridgeFile = createBridgeFile(this.resourcePath);
    bridges.push(bridgeFile);

    return CppJs;
}

module.exports = cppjsLoader;
