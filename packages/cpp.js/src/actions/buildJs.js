/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import fs from 'fs';
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import virtual from '@rollup/plugin-virtual';
import state from '../state/index.js';
import getData from './getData.js';

const nodeLibs = {
    fs: 'export default {};',
    path: 'export default {};',
    string_decoder: 'export default {};',
    buffer: 'export default {};',
    crypto: 'export default {};',
    stream: 'export default {};',
};

const options = {
    browser: {
        plugins: [virtual(nodeLibs), nodeResolve(), commonjs({ transformMixedEsModules: true, ignoreTryCatch: 'remove' })],
        output: {
            file: 'browser',
            format: 'umd',
            name: 'initCppJs',
        },
    },
    node: {
        plugins: [nodeResolve(), commonjs()],
        output: {
            file: 'node',
            format: 'umd',
            name: 'initCppJs',
        },
    },
};

export default async function buildJS(input, type) {
    const entryJS = `${state.config.paths.cli}/assets/${type}.js`;
    const env = JSON.stringify(getData('env', 'Emscripten-x86_64', type));
    const systemConfig = `export default {
        env: ${env},
        paths: {
            wasm: '${state.config.general.name}.wasm',
            data: '${state.config.general.name}.data.txt'
        }
    }`;
    let file = input;
    if (input.endsWith('.js')) {
        file = input.substring(0, input.length - 3);
    }
    // fs.renameSync(input, `${input}.raw.js`);
    const option = options[type];
    option.plugins = [virtual({
        'cpp.js/systemConfig': systemConfig,
        'cpp.js/module': `export { default } from '${input}';`,
    }), ...option.plugins];
    option.input = entryJS;
    option.output.file = `${file}.${option.output.file}.js`;
    const bundle = await rollup(option);
    await bundle.write(option.output);
    // fs.rmSync(`${input}.raw.js`, { force: true });
}
//
