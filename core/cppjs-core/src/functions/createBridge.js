import glob from 'glob';
import getBaseInfo from '../utils/getBaseInfo.js';
import getPathInfo from '../utils/getPathInfo.js';
import run from './run.js';

export default function createBridge(compiler) {
    const bridges = [];
    compiler.interfaces.forEach((filePath) => {
        const input = getPathInfo(filePath, compiler.config.paths.base);
        const output = getPathInfo(`${compiler.config.paths.temp}/bridge`, compiler.config.paths.base);
        const base = getBaseInfo(compiler.config.paths.base);

        const includePath = [
            ...glob.sync('node_modules/cppjs-lib-*/include', { absolute: true, cwd: compiler.config.paths.project }),
            ...glob.sync('node_modules/cppjs-lib-*/node_modules/cppjs-lib-*/include', { absolute: true, cwd: compiler.config.paths.project }),
            ...compiler.config.paths.header,
        ].filter((path) => !!path.toString()).map((path) => `-I/live/${getPathInfo(path, compiler.config.paths.base).relative}`);

        run(compiler, 'swig', [
            '-c++',
            '-emscripten',
            '-o', `/live/${output.relative}/${filePath.split('/').at(-1)}.cpp`,
            ...includePath,
            `/live/${input.relative}`,
        ]);

        bridges.push(`${base.withSlash}${output.relative}/${filePath.split('/').at(-1)}.cpp`);
    });
    return bridges;
}
