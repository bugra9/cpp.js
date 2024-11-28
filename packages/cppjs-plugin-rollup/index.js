/* eslint-disable no-restricted-syntax */
// eslint-disable-next-line object-curly-newline
import { state, createLib, createBridgeFile, buildWasm, getData } from 'cpp.js';

import fs from 'fs';
import p from 'path';

const platform = 'Emscripten-x86_64';

const rollupCppjsPlugin = (options, bridges = []) => {
    const env = JSON.stringify(getData('env'));
    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const moduleRegex = new RegExp(`\\.(${state.config.ext.module.join('|')})$`);
    const dependPackageNames = state.config.allDependencies;

    const params = `{
        ...config,
        env: {...${env}, ...config.env},
        paths: {
            wasm: 'cpp.wasm',
            data: 'cpp.data.txt'
        }
    }`;

    const CppJs = `
export let Native = {};
export function initCppJs(config = {}) {
    return new Promise(
        (resolve, reject) => import('/cpp.js').then(n => { return window.CppJs.initCppJs(${params})}).then(m => {
            Native = m;
            resolve(m);
        })
    );
}
`;

    return {
        name: 'rollup-plugin-cppjs',
        resolveId(source) {
            if (source === '/cpp.js') {
                return { id: source, external: true };
            }
            if (source === 'cpp.js') {
                return { id: source, external: false };
            }

            const dependPackage = dependPackageNames.find((d) => source.startsWith(d.package.name));
            if (dependPackage) {
                const filePath = source.substring(dependPackage.package.name.length + 1);

                let path = `${dependPackage.paths.output}/prebuilt/${platform}/${filePath}`;
                if (headerRegex.test(source)) {
                    path = `${dependPackage.paths.output}/prebuilt/${platform}/include/${filePath}`;
                } else if (moduleRegex.test(source)) {
                    path = `${dependPackage.paths.output}/prebuilt/${platform}/swig/${filePath}`;
                }

                return path;
            }
            return null;
        },
        load(id) {
            if (id === 'cpp.js') {
                return CppJs;
            }
            return null;
        },
        async transform(code, path) {
            if (!headerRegex.test(path) && !moduleRegex.test(path)) {
                return null;
            }

            const bridgeFile = createBridgeFile(path);
            bridges.push(bridgeFile);

            return CppJs;
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

            watch(state.config.paths.native);
        },
        async generateBundle() {
            createLib('Emscripten-x86_64', 'Source', { isProd: true, buildSource: true });
            createLib('Emscripten-x86_64', 'Bridge', { isProd: true, buildSource: false, nativeGlob: bridges });
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
