import fs from 'node:fs';
import run from './run.js';
import getDependLibs from './getDependLibs.js';
import getData from './getData.js';
import buildJs from './buildJs.js';
import state from '../state/index.js';

export default async function buildWasm(type, isProd = false) {
    const buildType = isProd ? 'Release' : 'Debug';
    const libs = [
        getDependLibs(),
        `${state.config.paths.build}/Source-${buildType}/Emscripten-x86_64/lib${state.config.general.name}.a`,
        `${state.config.paths.build}/Bridge-${buildType}/Emscripten-x86_64/lib${state.config.general.name}.a`,
    ];

    if (type === 'browser') {
        console.log('wasm compiling for browser...');
        const t0 = performance.now();
        const data = Object.entries(getData('data', 'Emscripten-x86_64', 'browser')).map(([key, value]) => ['--preload-file', `${key.replaceAll('@', '@@')}@${value}`]).flat();
        run('emcc', [
            '-lembind', '-Wl,--whole-archive',
            ...libs, ...(isProd ? ['-O3'] : []),
            '-s', 'WASM=1', '-s', 'MODULARIZE=1', '-s', 'DYNAMIC_EXECUTION=0',
            '-s', 'RESERVED_FUNCTION_POINTERS=200', '-s', 'DISABLE_EXCEPTION_CATCHING=0', '-s', 'FORCE_FILESYSTEM=1',
            '-s', 'ALLOW_MEMORY_GROWTH=1',
            '-s', 'EXPORTED_RUNTIME_METHODS=["FS", "ENV"]',
            '-o', `${state.config.paths.build}/${state.config.general.name}.js`,
            ...data,
        ]);
        const t1 = performance.now();
        console.log('wasm compiled for browser...', Math.round(t1 - t0));
        console.log('js compiling for browser...');
        await buildJs(`${state.config.paths.build}/${state.config.general.name}.js`, 'browser');
        const t2 = performance.now();
        console.log('js compiled for browser...', Math.round(t2 - t1));
    }

    if (type === 'node') {
        console.log('wasm compiling for node...');
        run('emcc', [
            '-lembind', '-Wl,--whole-archive', '-lnodefs.js',
            ...libs, ...(isProd ? ['-O3'] : []),
            '-s', 'WASM=1', '-s', 'MODULARIZE=1', '-s', 'DYNAMIC_EXECUTION=0',
            '-s', 'RESERVED_FUNCTION_POINTERS=200', '-s', 'DISABLE_EXCEPTION_CATCHING=0', '-s', 'FORCE_FILESYSTEM=1', '-s', 'NODERAWFS',
            '-s', 'ALLOW_MEMORY_GROWTH=1',
            '-s', 'EXPORTED_RUNTIME_METHODS=["FS", "ENV", "NODEFS"]',
            '-o', `${state.config.paths.build}/${state.config.general.name}.js`,
        ]);
        console.log('wasm compiled for node...');
        console.log('js compiling for node...');
        await buildJs(`${state.config.paths.build}/${state.config.general.name}.js`, 'node');
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
