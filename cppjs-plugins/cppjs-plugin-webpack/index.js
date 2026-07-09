
import fs from 'node:fs';
import {
    state, createLib, buildWasm, createBridgeFile, getData, getCppJsScript, buildDependencies, getTargetParams, getFilteredBuildTargets, isSourceNewer,
} from 'cpp.js';

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
        // tapPromise (not tap) so webpack awaits the native C++/wasm build and a build
        // failure surfaces as a compilation error instead of an unhandled rejection.
        compiler.hooks.done.tapPromise(pluginName, this.onDone.bind(this));
        compiler.hooks.afterCompile.tapAsync(pluginName, this.afterCompile.bind(this));
    }

    afterCompile(compilation, callback) {
        state.config.paths.native.map((file) => compilation.contextDependencies.add(file));
        callback();
    }

    async onDone({ compilation }) {
        const isDev = compilation.options.mode === 'development';
        const buildTarget = isDev ? buildTargetDebug : buildTargetRelease;
        await buildDependencies({ targetParams: { ...targetParams, buildType: [buildTarget.buildType] } });
        const force = isSourceNewer(buildTarget);
        const sourceBuilt = createLib(buildTarget, 'Source', { force, buildSource: true });
        // Bridge cache is keyed on the nativeGlob fingerprint: a changed bridge
        // set rebuilds the lib even without source changes, and a rebuilt lib
        // must force the final link too.
        const bridgeBuilt = createLib(buildTarget, 'Bridge', { force, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/cpp-runtime/commonBridges.cpp`, ...this.bridges] });
        await buildWasm(buildTarget, { force: force || Boolean(sourceBuilt) || Boolean(bridgeBuilt) });
        if (!isDev) {
            const output = state.config.paths.output === state.config.paths.build ? compilation.options.output.path : state.config.paths.output;
            // On a first-ever build the output dir may not exist yet when this
            // hook runs; copyFileSync reports that as ENOENT too.
            fs.mkdirSync(output, { recursive: true });
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

    getRule() {
        return {
            test: new RegExp(`\\.(${state.config.ext.header.join('|')})$`),
            loader: '@cpp.js/plugin-webpack-loader',
            options: { ...this.getLoaderOptions() },
        };
    }

    setDevServerMiddleware(middlewares, devServer) {
        if (!devServer) {
            throw new Error('devServer is not defined');
        }

        middlewares.unshift({
            name: '/cpp.js',
            path: '/cpp.js',
            middleware: (req, res) => {
                const filePath = `${state.config.paths.build}/${buildTargetDebug.jsName}`;
                res.setHeader('Content-Type', 'application/javascript');
                res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
                fs.createReadStream(filePath).pipe(res);
            },
        });

        middlewares.unshift({
            name: '/cpp.wasm',
            path: '/cpp.wasm',
            middleware: (req, res) => {
                const filePath = `${state.config.paths.build}/${buildTargetDebug.wasmName}`;
                res.setHeader('Content-Type', 'application/wasm');
                res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
                fs.createReadStream(filePath).pipe(res);
            },
        });

        middlewares.unshift({
            name: '/cpp.data.txt',
            path: '/cpp.data.txt',
            middleware: (req, res) => {
                const filePath = `${state.config.paths.build}/${buildTargetDebug.dataTxtName}`;
                res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
                res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
                if (!fs.existsSync(filePath)) {
                    res.statusCode = 404;
                    res.end();
                    return;
                }
                fs.createReadStream(filePath).pipe(res);
            },
        });

        return middlewares;
    }

    getDevServerConfig() {
        return {
            watchFiles: state.config.paths.native,
            hot: true,
            liveReload: true,
            headers: {
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'require-corp',
            },
            setupMiddlewares: (middlewares, devServer) => {
                return this.setDevServerMiddleware(middlewares, devServer);
            },
        };
    }
}
