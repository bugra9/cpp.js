import getBaseInfo from '../utils/getBaseInfo.js';
import getPathInfo from '../utils/getPathInfo.js';
import { getDependencyParams } from './getCmakeParams.js';
import run from './run.js';

const platform = 'Emscripten-x86_64';

export default function createBridge(compiler) {
    const bridges = [];

    const allHeaders = getDependencyParams(compiler.config).headerPathWithDepends.split(';');

    let includePath = [
        ...compiler.config.getAllDependencies().map((d) => `${d.paths.output}/prebuilt/${platform}/include`),
        ...compiler.config.getAllDependencies().map((d) => `${d.paths.output}/prebuilt/${platform}/swig`),
        ...compiler.config.paths.header,
        ...allHeaders,
    ].filter((path) => !!path.toString()).map((path) => `-I/tmp/cppjs/live/${getPathInfo(path, compiler.config.paths.base).relative}`);
    includePath = [...new Set(includePath)];

    compiler.interfaces.forEach((filePath) => {
        const input = getPathInfo(filePath, compiler.config.paths.base);
        const output = getPathInfo(`${compiler.config.paths.temp}/bridge`, compiler.config.paths.base);
        const base = getBaseInfo(compiler.config.paths.base);

        run(compiler, 'swig', [
            '-c++',
            '-embind',
            '-o', `/tmp/cppjs/live/${output.relative}/${filePath.split('/').at(-1)}.cpp`,
            ...includePath,
            `/tmp/cppjs/live/${input.relative}`,
        ]);

        bridges.push(`${base.withSlash}${output.relative}/${filePath.split('/').at(-1)}.cpp`);
    });
    return bridges;
}
