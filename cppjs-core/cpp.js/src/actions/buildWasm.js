import fs from 'node:fs';
import replace from 'replace';
import run from './run.js';
import getDependLibs from './getDependLibs.js';
import getData from './getData.js';
import buildJs from './buildJs.js';
import triggerExtensions from './extensions.js';
import state from '../state/index.js';
import logger from '../utils/logger.js';

export default async function buildWasm(target, options = {}) {
    const isProd = target.buildType === 'release';
    const buildType = isProd ? 'Release' : 'Debug';

    // Caller can opt out of the final emcc link entirely (e.g. when the
    // package is consumed only as a static library by downstream builds).
    if (state.config.export.bundle === false) {
        logger.info(`[${target.path}] wasm+js skipped (export.bundle = false)`);
        return;
    }

    if (!options.force && fs.existsSync(`${state.config.paths.build}/${target.jsName}`) && fs.existsSync(`${state.config.paths.build}/${target.wasmName}`)) {
        logger.cachedStep(target, 'wasm+js');
        return;
    }

    const libs = [
        ...getDependLibs(target),
        `${state.config.paths.build}/Source-${buildType}/${target.path}/lib${state.config.general.name}.a`,
        `${state.config.paths.build}/Bridge-${buildType}/${target.path}/lib${state.config.general.name}.a`,
    ];

    const binary = getData('binary', target);
    const emccFlags = binary?.emccFlags || [];

    triggerExtensions('buildWasm', 'beforeBuild', [emccFlags]);

    if (target.runtime === 'mt' && !emccFlags.includes('-pthread')) {
        emccFlags.push('-pthread');
        emccFlags.push('-sPTHREAD_POOL_SIZE=Math.min(navigator.hardwareConcurrency || 1, 2)');
        emccFlags.push('-sPTHREAD_POOL_SIZE_STRICT=2');
    }

    if (target.platform === 'wasm') {
        emccFlags.push('-msimd128');
    }

    if (target.arch === 'wasm64') {
        emccFlags.push('-sMEMORY64=1');
    }

    if (state.config.excludedDependencies?.length && !emccFlags.includes('-sERROR_ON_UNDEFINED_SYMBOLS=0')) {
        emccFlags.push('-sERROR_ON_UNDEFINED_SYMBOLS=0');
    }

    if (target.runtimeEnv === 'browser') {
        logger.startStep(target, 'wasm');
        const t0 = performance.now();

        triggerExtensions('buildWasm', 'beforeBuildBrowser', [emccFlags]);

        const data = Object.entries(getData('data', target)).map(([key, value]) => ['--preload-file', `${key.replaceAll('@', '@@')}@/cppjs/${value}`]).flat();
        run('emcc', [
            '-lembind', '-Wl,--whole-archive',
            ...emccFlags,
            // '-lwebsocket.js', '-sPROXY_POSIX_SOCKETS', '-sWEBSOCKET_DEBUG=1', '-sJSPI', '-g', '-sWASMFS',
            '-sWASM_BIGINT=1', '-s', 'FORCE_FILESYSTEM=1',
            '-sEXPORT_NAME=Module2', // '-pthread', '-sPTHREAD_POOL_SIZE=5',
            ...libs, `${state.config.paths.cli}/assets/cpp-runtime/browser.cpp`,
            ...(isProd ? ['-O3'] : []),
            '-s', 'WASM=1', '-s', 'MODULARIZE=1', '-s', 'DYNAMIC_EXECUTION=0',
            '-s', 'RESERVED_FUNCTION_POINTERS=200', // '-s', 'FORCE_FILESYSTEM=1',
            '-s', 'ALLOW_MEMORY_GROWTH=1',
            '-s', 'WASMFS',
            '-s', 'ENVIRONMENT=web,webview,worker',
            '-s', 'EXPORTED_RUNTIME_METHODS=["FS", "ENV"]',
            '-fwasm-exceptions',
            '-o', `${state.config.paths.build}/${target.rawJsName}`,
            ...data,
        ], null, target);
        const t1 = performance.now();
        logger.doneStep(target, 'wasm');
        logger.startStep(target, 'js');
        replace({
            regex: 'var _scriptName = ',
            replacement: `var _scriptName = 'cpp.worker.js'; //`,
            paths: [`${state.config.paths.build}/${target.rawJsName}`],
            recursive: false,
            silent: true,
        });
        /* replace({
            regex: 'val === 10',
            replacement: 'false',
            paths: [`${state.config.paths.build}/${state.config.general.name}.js`],
            recursive: false,
            silent: true,
        }); */
        await buildJs(target);
        // fs.rmSync(`${state.config.paths.build}/${state.config.general.name}.js`);
        // fs.copyFileSync(`${state.config.paths.build}/${state.config.general.name}.browser.js`, `${state.config.paths.build}/${state.config.general.name}.js`);
        // fs.renameSync(`${state.config.paths.build}/${state.config.general.name}.js`, `${state.config.paths.build}/${state.config.general.name}.worker.browser.js`);
        logger.doneStep(target, 'js');
    }

    if (target.runtimeEnv === 'edge') {
        logger.startStep(target, 'wasm');
        const t0 = performance.now();

        triggerExtensions('buildWasm', 'beforeBuildEdge', [emccFlags]);

        const data = Object.entries(getData('data', target)).map(([key, value]) => ['--preload-file', `${key.replaceAll('@', '@@')}@/cppjs/${value}`]).flat();
        run('emcc', [
            '-lembind', '-Wl,--whole-archive',
            ...emccFlags,
            '-sWASM_BIGINT=1',
            '-sEXPORT_NAME=Module2',
            ...libs,
            ...(isProd ? ['-O3'] : []),
            '-s', 'WASM=1', '-s', 'MODULARIZE=1', '-s', 'DYNAMIC_EXECUTION=0',
            '-s', 'RESERVED_FUNCTION_POINTERS=200', // '-s', 'FORCE_FILESYSTEM=1',
            '-s', 'ALLOW_MEMORY_GROWTH=1',
            '-s', 'ENVIRONMENT=web',
            '-s', 'EXPORTED_RUNTIME_METHODS=["ENV"]',
            '-fwasm-exceptions',
            '-o', `${state.config.paths.build}/${target.rawJsName}`,
            ...data,
        ], null, target);
        const t1 = performance.now();
        logger.doneStep(target, 'wasm');
        logger.startStep(target, 'js');
        await buildJs(target);
        logger.doneStep(target, 'js');
    }

    if (target.runtimeEnv === 'node') {
        logger.startStep(target, 'wasm');

        triggerExtensions('buildWasm', 'beforeBuildNodeJS', [emccFlags]);

        run('emcc', [
            '-lembind', '-Wl,--whole-archive',
            ...emccFlags,
            // '-s', 'FETCH', '-sJSPI', '-sWASM_BIGINT=1', '-pthread', '-sPTHREAD_POOL_SIZE=5',
            '-sWASM_BIGINT=1', '-s', 'FORCE_FILESYSTEM=1',
            ...libs, `${state.config.paths.cli}/assets/cpp-runtime/node.cpp`,
            ...(isProd ? ['-O3'] : []),
            '-s', 'WASM=1', '-s', 'MODULARIZE=1', '-s', 'DYNAMIC_EXECUTION=0',
            '-s', 'RESERVED_FUNCTION_POINTERS=200', // '-s', 'DISABLE_EXCEPTION_CATCHING=0', '-s', 'FORCE_FILESYSTEM=1',
            '-s', 'ALLOW_MEMORY_GROWTH=1',
            '-s', 'WASMFS',
            '-s', 'NODE_HOST_ENV=1',
            '-s', 'ENVIRONMENT=node',
            '-s', 'EXPORTED_RUNTIME_METHODS=["FS", "ENV"]',
            '-fwasm-exceptions',
            '-o', `${state.config.paths.build}/${target.rawJsName}`,
        ], null, target);
        logger.doneStep(target, 'wasm');
        logger.startStep(target, 'js');
        await buildJs(target);
        if (emccFlags.includes('FETCH')) {
            fs.appendFileSync(`${state.config.paths.build}/${target.jsName}`, 'var XMLHttpRequest = require(\'xhr2\');\n');
        }
        // fs.renameSync(`${state.config.paths.build}/${state.config.general.name}.js`, `${state.config.paths.build}/${state.config.general.name}.worker.node.js`);
        logger.doneStep(target, 'js');

        Object.entries(getData('data', target)).forEach(([key, value]) => {
            if (fs.existsSync(key)) {
                const dAssetPath = `${state.config.paths.build}/data/${value}`;
                if (!fs.existsSync(dAssetPath)) {
                    fs.mkdirSync(dAssetPath, { recursive: true });
                    fs.cpSync(key, dAssetPath, { recursive: true });
                }
            }
        });
    }

    if (fs.existsSync(`${state.config.paths.build}/${target.dataName}`)) {
        fs.renameSync(`${state.config.paths.build}/${target.dataName}`, `${state.config.paths.build}/${target.dataTxtName}`);
    }
}
