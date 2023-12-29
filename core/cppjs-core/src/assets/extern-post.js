let cppJsPromise;
export default function initCppJs(config = {}) {
    if (cppJsPromise) return cppJsPromise;

    cppJsPromise = new Promise((resolve, reject) => {
        const m = {
            locateFile(fileName) {
                let path = fileName;
                if (config.paths && config.paths.wasm && fileName.split('.').pop() === 'wasm') {
                    path = config.paths.wasm;
                } else if (config.paths && config.paths.data && fileName.split('.').pop() === 'data') {
                    path = config.paths.data;
                }

                let prefix = '';
                if (config.path) {
                    prefix = config.path;
                    if (prefix.slice(-1) !== '/') prefix += '/';
                }

                let output = prefix + path;
                if (output.substring(0, 4) !== 'http' && output[0] !== '/') output = `/${output}`;
                return output;
            },
        };
        Module(m).then(resolve).catch(reject);
    });

    return cppJsPromise;
}
