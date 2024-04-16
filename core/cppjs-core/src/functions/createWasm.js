import run from './run.js';
import getCmakeParams from './getCmakeParams.js';
import getLibs from './getLibs.js';
import getData from './getData.js';
import getPathInfo from '../utils/getPathInfo.js';

export default function createWasm(compiler, options) {
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
    const data = Object.entries(getData(compiler.config, 'data', '/tmp/cppjs/live/')).map(([key, value]) => ['--preload-file', `${key}@${value}`]).flat();
    run(compiler, 'emcc', [
        '-lembind', '-Wl,--whole-archive',
        ...libs, ...(options.cc || []),
        '-s', 'WASM=1', '-s', 'MODULARIZE=1',
        '-s', 'EXPORTED_RUNTIME_METHODS=["FS", "ENV"]',
        '-o', `${output}/${compiler.config.general.name}.js`,
        '--extern-post-js', '/tmp/cppjs/cli/assets/extern-post.js',
        ...data,
    ]);

    return compiler.config.paths.temp;
}
