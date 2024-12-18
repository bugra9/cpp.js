/* eslint-disable no-restricted-syntax */
// eslint-disable-next-line object-curly-newline
import { state, createLib, createBridgeFile, buildWasm, getCppJsScript, getDependFilePath } from 'cpp.js';

import fs from 'node:fs';
import p from 'node:path';

const rollupCppjsPlugin = (options, bridges = []) => {
    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const moduleRegex = new RegExp(`\\.(${state.config.ext.module.join('|')})$`);

    return {
        name: 'rollup-plugin-cppjs',
        resolveId(source) {
            if (source === '/cpp.js') {
                return { id: source, external: true };
            }
            if (source === 'cpp.js') {
                return { id: source, external: false };
            }

            const dependFilePath = getDependFilePath(source, 'Emscripten-x86_64');
            if (dependFilePath) {
                return dependFilePath;
            }

            return null;
        },
        load(id) {
            if (id === 'cpp.js') {
                return getCppJsScript('Emscripten-x86_64');
            }
            return null;
        },
        async transform(code, path) {
            if (!headerRegex.test(path) && !moduleRegex.test(path)) {
                return null;
            }

            const bridgeFile = createBridgeFile(path);
            bridges.push(bridgeFile);

            return getCppJsScript('Emscripten-x86_64', bridgeFile);
        },
        buildStart() {
            const watch = (dirs) => {
                dirs.forEach((dir) => {
                    const filesToWatch = fs.readdirSync(dir);

                    for (const file of filesToWatch) {
                        const fullPath = p.join(dir, file);
                        const stats = fs.statSync(fullPath);

                        if (stats.isFile()) {
                            this.addWatchFile(fullPath);
                        } else if (stats.isDirectory()) {
                            watch([fullPath]);
                        }
                    }
                });
            };

            if (fs.existsSync(state.config.paths.native)) {
                watch(state.config.paths.native);
            }
        },
        async generateBundle() {
            createLib('Emscripten-x86_64', 'Source', { isProd: true, buildSource: true });
            createLib('Emscripten-x86_64', 'Bridge', { isProd: true, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/commonBridges.cpp`, ...bridges] });
            await buildWasm('browser', true);
            await buildWasm('node', true);
            this.emitFile({
                type: 'asset',
                source: fs.readFileSync(`${state.config.paths.build}/${state.config.general.name}.browser.js`),
                fileName: 'cpp.js',
            });
            this.emitFile({
                type: 'asset',
                source: fs.readFileSync(`${state.config.paths.build}/${state.config.general.name}.wasm`),
                fileName: 'cpp.wasm',
            });
            const dataFilePath = `${state.config.paths.build}/${state.config.general.name}.data.txt`;
            if (fs.existsSync(dataFilePath)) {
                this.emitFile({
                    type: 'asset',
                    source: fs.readFileSync(dataFilePath),
                    fileName: 'cpp.data.txt',
                });
            }
        },
    };
};

export default rollupCppjsPlugin;
