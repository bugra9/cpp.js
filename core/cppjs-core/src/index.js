import createBridge from './functions/createBridge.js';
import findOrCreateInterfaceFile from './functions/findOrCreateInterfaceFile.js';
import run from './functions/run.js';
import getCmakeParams from './functions/getCmakeParams.js';
import getData from './functions/getData.js';
import createWasm from './functions/createWasm.js';
import getConfig from './utils/getConfig.js';

const platforms = ['Emscripten-x86_64', 'Android-arm64-v8a'];
export default class CppjsCompiler {
    constructor(platform) {
        this.config = getConfig();
        this.interfaces = [];
        this.platform = platform;
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

    getData(field) {
        return getData(this.config, field, '/live/');
    }

    run(program, params, dockerOptions) {
        run(this, program, params, dockerOptions);
    }

    // eslint-disable-next-line class-methods-use-this
    getAllPlatforms() {
        return platforms;
    }
}
