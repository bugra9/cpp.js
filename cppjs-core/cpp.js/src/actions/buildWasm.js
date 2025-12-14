import fs from 'node:fs';
import replace from 'replace';
import run from './run.js';
import getDependLibs from './getDependLibs.js';
import getData from './getData.js';
import buildJs from './buildJs.js';
import triggerExtensions from './extensions.js';
import state from '../state/index.js';

export default async function buildWasm(type, isProd = false) {
    const buildType = isProd ? 'Release' : 'Debug';
    const libs = [
        ...getDependLibs(),
        `${state.config.paths.build}/Source-${buildType}/Emscripten-x86_64/lib${state.config.general.name}.a`,
        `${state.config.paths.build}/Bridge-${buildType}/Emscripten-x86_64/lib${state.config.general.name}.a`,
    ];

    const binary = getData('binary', 'Emscripten-x86_64');

    if (type === 'browser') {
        console.log('wasm compiling for browser...');
        const t0 = performance.now();
        const emccFlags = [
            ...(binary?.emccFlags || []),
            ...(getData('binary', 'Emscripten-x86_64', 'browser')?.emccFlags || []),
        ];

        triggerExtensions('buildWasm', 'beforeBuildBrowser', [emccFlags]);

        if (state.config.build.usePthread && !emccFlags.includes('-pthread')) {
            emccFlags.push('-pthread');
            emccFlags.push('-sPTHREAD_POOL_SIZE=4');
        }

        const data = Object.entries(getData('data', 'Emscripten-x86_64', 'browser')).map(([key, value]) => ['--preload-file', `${key.replaceAll('@', '@@')}@${value}`]).flat();
        run('emcc', [
            '-lembind', '-Wl,--whole-archive',
            ...emccFlags,
            // '-lwebsocket.js', '-sPROXY_POSIX_SOCKETS', '-sWEBSOCKET_DEBUG=1', '-sJSPI', '-g', '-sWASMFS',
            '-sWASM_BIGINT=1', '-s', 'FORCE_FILESYSTEM=1',
            '-sEXPORT_NAME=Module2', // '-pthread', '-sPTHREAD_POOL_SIZE=5',
            ...libs, ...(isProd ? ['-O3'] : []),
            '-s', 'WASM=1', '-s', 'MODULARIZE=1', '-s', 'DYNAMIC_EXECUTION=0',
            /* '-s', 'RESERVED_FUNCTION_POINTERS=200',*/ // '-s', 'FORCE_FILESYSTEM=1',
            //            '-s', 'ALLOW_MEMORY_GROWTH=1',
            '-s', 'EXPORTED_RUNTIME_METHODS=["FS", "ENV"]',
            '-fwasm-exceptions',
            '-o', `${state.config.paths.build}/${state.config.general.name}.js`,
            ...data,
        ]);
        const t1 = performance.now();
        console.log('wasm compiled for browser...', Math.round(t1 - t0));
        console.log('js compiling for browser...');
        replace({
            regex: 'var _scriptName = ',
            replacement: `var _scriptName = 'cpp.worker.js'; //`,
            paths: [`${state.config.paths.build}/${state.config.general.name}.js`],
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
        await buildJs(`${state.config.paths.build}/${state.config.general.name}.js`, 'browser');
        // fs.rmSync(`${state.config.paths.build}/${state.config.general.name}.js`);
        // fs.copyFileSync(`${state.config.paths.build}/${state.config.general.name}.browser.js`, `${state.config.paths.build}/${state.config.general.name}.js`);
        // fs.renameSync(`${state.config.paths.build}/${state.config.general.name}.js`, `${state.config.paths.build}/${state.config.general.name}.worker.browser.js`);
        const t2 = performance.now();
        console.log('js compiled for browser...', Math.round(t2 - t1));
    }

    if (type === 'node') {
        console.log('wasm compiling for node...');
        const emccFlags = [
            ...(binary?.emccFlags || []),
            ...(getData('binary', 'Emscripten-x86_64', 'node')?.emccFlags || []),
        ];

        triggerExtensions('buildWasm', 'beforeBuildNodeJS', [emccFlags]);

        if (state.config.build.usePthread && !emccFlags.includes('-pthread')) {
            emccFlags.push('-pthread');
            emccFlags.push('-sPTHREAD_POOL_SIZE=4');
        }

        run('emcc', [
            '-lembind', '-Wl,--whole-archive', '-lnodefs.js',
            ...emccFlags,
            // '-s', 'FETCH', '-sJSPI', '-sWASM_BIGINT=1', '-pthread', '-sPTHREAD_POOL_SIZE=5',
            '-sWASM_BIGINT=1', '-s', 'FORCE_FILESYSTEM=1',
            ...libs, ...(isProd ? ['-O3'] : []),
            '-s', 'WASM=1', '-s', 'MODULARIZE=1', '-s', 'DYNAMIC_EXECUTION=0',
            // '-s', 'RESERVED_FUNCTION_POINTERS=200', '-s', 'DISABLE_EXCEPTION_CATCHING=0', '-s', 'FORCE_FILESYSTEM=1',
            // '-s', 'ALLOW_MEMORY_GROWTH=1',
            '-s', 'NODERAWFS',
            '-s', 'EXPORTED_RUNTIME_METHODS=["FS", "ENV", "NODEFS"]',
            '-fwasm-exceptions',
            '-o', `${state.config.paths.build}/${state.config.general.name}.js`,
        ]);
        console.log('wasm compiled for node...');
        console.log('js compiling for node...');
        await buildJs(`${state.config.paths.build}/${state.config.general.name}.js`, 'node');
        if (emccFlags.includes('FETCH')) {
            fs.appendFileSync(`${state.config.paths.build}/${state.config.general.name}.node.js`, 'var XMLHttpRequest = require(\'xhr2\');\n');
        }
        // fs.renameSync(`${state.config.paths.build}/${state.config.general.name}.js`, `${state.config.paths.build}/${state.config.general.name}.worker.node.js`);
        console.log('js compiled for node...');

        Object.entries(getData('data', 'Emscripten-x86_64', 'node')).forEach(([key, value]) => {
            if (fs.existsSync(key)) {
                const dAssetPath = `${state.config.paths.build}/data/${value}`;
                if (!fs.existsSync(dAssetPath)) {
                    fs.mkdirSync(dAssetPath, { recursive: true });
                    fs.cpSync(key, dAssetPath, { recursive: true });
                }
            }
        });
    }

    if (fs.existsSync(`${state.config.paths.build}/${state.config.general.name}.data`)) {
        fs.renameSync(`${state.config.paths.build}/${state.config.general.name}.data`, `${state.config.paths.build}/${state.config.general.name}.data.txt`);
    }
}
