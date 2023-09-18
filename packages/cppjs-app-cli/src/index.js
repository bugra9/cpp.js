import createBridge from './functions/createBridge.js';
import findOrCreateInterfaceFile from './functions/findOrCreateInterfaceFile.js';
import createWasm, { getCmakeParams } from './functions/createWasm.js';
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
        return getCmakeParams(this);
    }
}
