import fs from 'fs';
import buildJS from './buildJS.js';
import run from './run.js';
import getCmakeParams from './getCmakeParams.js';
import getLibs from './getLibs.js';
import getData from './getData.js';
import getPathInfo from '../utils/getPathInfo.js';

export default async function createWasm(compiler, options = {}) {
    const output = `/tmp/cppjs/live/${getPathInfo(compiler.config.paths.temp, compiler.config.paths.base).relative}`;

    let params = getCmakeParams(compiler.config, '/tmp/cppjs/live/', true, false);
    run(compiler, 'emcmake', [
        'cmake', '/tmp/cppjs/cmake',
        '-DCMAKE_BUILD_TYPE=Release', '-DBUILD_TYPE=STATIC',
        `-DCMAKE_INSTALL_PREFIX=${output}`, `-DPROJECT_NAME=${compiler.config.general.name}`,
        ...params,
    ]);
    run(compiler, 'emmake', ['make', 'install']);

    params = getCmakeParams(compiler.config, '/tmp/cppjs/live/', false, true);
    run(compiler, 'emcmake', [
        'cmake', '/tmp/cppjs/cmake',
        '-DCMAKE_BUILD_TYPE=Release', '-DBUILD_TYPE=STATIC',
        `-DCMAKE_INSTALL_PREFIX=${output}`, `-DPROJECT_NAME=${compiler.config.general.name}bridge`,
        ...params,
    ]);
    run(compiler, 'emmake', ['make', 'install']);

    const libs = getLibs(compiler.config, '/tmp/cppjs/live/');
    const data = Object.entries(getData(compiler.config, 'data', '/tmp/cppjs/live/', 'Emscripten-x86_64', 'browser')).map(([key, value]) => ['--preload-file', `${key.replaceAll('@', '@@')}@${value}`]).flat();
    run(compiler, 'emcc', [
        '-lembind', '-Wl,--whole-archive',
        ...libs, ...(options.cc || []),
        '-s', 'WASM=1', '-s', 'MODULARIZE=1', '-s', 'DYNAMIC_EXECUTION=0',
        '-s', 'RESERVED_FUNCTION_POINTERS=200', '-s', 'DISABLE_EXCEPTION_CATCHING=0', '-s', 'FORCE_FILESYSTEM=1',
        '-s', 'ALLOW_MEMORY_GROWTH=1',
        '-s', 'EXPORTED_RUNTIME_METHODS=["FS", "ENV"]',
        '-o', `${output}/${compiler.config.general.name}.js`,
        ...data,
    ]);
    await buildJS(compiler, `${compiler.config.paths.temp}/${compiler.config.general.name}.js`, 'browser');
    run(compiler, 'emcc', [
        '-lembind', '-Wl,--whole-archive', '-lnodefs.js',
        ...libs, ...(options.cc || []),
        '-s', 'WASM=1', '-s', 'MODULARIZE=1', '-s', 'DYNAMIC_EXECUTION=0',
        '-s', 'RESERVED_FUNCTION_POINTERS=200', '-s', 'DISABLE_EXCEPTION_CATCHING=0', '-s', 'FORCE_FILESYSTEM=1', '-s', 'NODERAWFS',
        '-s', 'ALLOW_MEMORY_GROWTH=1',
        '-s', 'EXPORTED_RUNTIME_METHODS=["FS", "ENV", "NODEFS"]',
        '-o', `${output}/${compiler.config.general.name}.js`,
    ]);
    Object.entries(getData(compiler.config, 'data', null, 'Emscripten-x86_64', 'node')).forEach(([key, value]) => {
        if (fs.existsSync(key)) {
            const dAssetPath = `${compiler.config.paths.temp}/data/${value}`;
            if (!fs.existsSync(dAssetPath)) {
                fs.mkdirSync(dAssetPath, { recursive: true });
                fs.cpSync(key, dAssetPath, { recursive: true });
            }
        }
    });
    await buildJS(compiler, `${compiler.config.paths.temp}/${compiler.config.general.name}.js`, 'node');
    if (fs.existsSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.data`)) {
        fs.renameSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.data`, `${compiler.config.paths.temp}/${compiler.config.general.name}.data.txt`);
    }

    return compiler.config.paths.temp;
}
