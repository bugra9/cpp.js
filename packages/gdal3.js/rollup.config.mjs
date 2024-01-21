import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import virtual from '@rollup/plugin-virtual';
import istanbul from 'rollup-plugin-istanbul';
import { uglify } from 'rollup-plugin-uglify';
import rollupCppjsPlugin from 'rollup-plugin-cppjs';

const nodeLibs = {
    fs: 'export default {};',
    path: 'export default {};',
    string_decoder: 'export default {};',
    buffer: 'export default {};',
    crypto: 'export default {};',
    stream: 'export default {};',
};

export default [
    {
        plugins: [rollupCppjsPlugin(), virtual(nodeLibs), nodeResolve(), commonjs({ transformMixedEsModules: true, ignoreTryCatch: 'remove' }), babel({ babelHelpers: 'bundled' }), uglify()],
        input: 'src/index.js',
        output: {
            file: 'build/package/gdal3.js',
            format: 'umd',
            name: 'initGdalJs',
        },
    },
];
