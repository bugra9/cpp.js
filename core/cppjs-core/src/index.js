import createBridge from './functions/createBridge.js';
import findOrCreateInterfaceFile from './functions/findOrCreateInterfaceFile.js';
import run from './functions/run.js';
import getCmakeParams from './functions/getCmakeParams.js';
import createWasm from './functions/createWasm.js';
import getConfig from './utils/getConfig.js';

export default class CppjsCompiler {
    constructor() {
        this.config = getConfig();
        this.interfaces = [];
    }

    findOrCreateInterfaceFile(path) {
        return findOrCreateInterfaceFile(this, path);
    }

    createBridge() {
        return createBridge(this);
    }

    createWasm(options) {
        return createWasm(this, options);
    }

    getCmakeParams() {
        return getCmakeParams(this.config, null, true, true);
    }

    run(program, params, dockerOptions) {
        run(this, program, params, dockerOptions);
    }
}
