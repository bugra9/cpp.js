
import fs from 'node:fs';
import { state, createLib, buildWasm, createBridgeFile, getData, getCppJsScript, getTargetParams, getFilteredBuildTargets } from 'cpp.js';

const targetParams = getTargetParams({ platform: ['wasm'], arch: ['wasm32'], runtime: ['st'], runtimeEnv: ['browser'] }, true);
let buildTargetRelease = getFilteredBuildTargets(targetParams, { buildType: 'release' })?.[0];
let buildTargetDebug = getFilteredBuildTargets(targetParams, { buildType: 'debug' })?.[0];

if (!buildTargetRelease && !buildTargetDebug) {
    throw new Error('No build targets found');
}

if (!buildTargetDebug) {
    buildTargetDebug = buildTargetRelease;
} else if (!buildTargetRelease) {
    buildTargetRelease = buildTargetDebug;
}

export default class CppjsWebpackPlugin {
    static defaultOptions = {};

    constructor(options = {}) {
        this.options = { ...CppjsWebpackPlugin.defaultOptions, ...options };
        this.bridges = [];
    }

    apply(compiler) {
        const pluginName = this.constructor.name;
        compiler.hooks.done.tap(pluginName, this.onDone.bind(this));
        compiler.hooks.afterCompile.tapAsync(pluginName, this.afterCompile.bind(this));
    }

    afterCompile(compilation, callback) {
        state.config.paths.native.map((file) => compilation.contextDependencies.add(file));
        callback();
    }

    async onDone({ compilation }) {
        const isDev = compilation.options.mode === 'development';
        const buildTarget = isDev ? buildTargetDebug : buildTargetRelease;
        createLib(buildTarget, 'Source', { buildSource: true });
        createLib(buildTarget, 'Bridge', { buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/commonBridges.cpp`, ...this.bridges] });
        await buildWasm(buildTarget);
        if (!isDev) {
            const output = state.config.paths.output === state.config.paths.build ? compilation.options.output.path : state.config.paths.output;
            fs.copyFileSync(`${state.config.paths.build}/${buildTarget.jsName}`, `${output}/cpp.js`);
            fs.copyFileSync(`${state.config.paths.build}/${buildTarget.wasmName}`, `${output}/cpp.wasm`);

            const dataFilePath = `${state.config.paths.build}/${buildTarget.dataTxtName}`;
            if (fs.existsSync(dataFilePath)) {
                fs.copyFileSync(dataFilePath, `${output}/cpp.data.txt`);
            }
            /* const workerFilePath = `${state.config.paths.build}/${state.config.general.name}.js`;
            if (fs.existsSync(workerFilePath)) {
                fs.copyFileSync(workerFilePath, `${output}/cpp.worker.js`);
            } */
        }
    }

    getLoaderOptions() {
        return {
            bridges: this.bridges,
            createBridgeFile,
            getData,
            state,
            getCppJsScript,
            getTargetParams,
            getFilteredBuildTargets
        };
    }
}
