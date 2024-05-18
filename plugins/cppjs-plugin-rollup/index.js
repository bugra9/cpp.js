import CppjsCompiler from 'cpp.js';

import fs from 'fs';
import p from 'path';

const platform = 'Emscripten-x86_64';

const rollupCppjsPlugin = (options, _compiler) => {
    const compiler = _compiler || new CppjsCompiler();
    const env = JSON.stringify(compiler.getData('env'));
    const headerRegex = new RegExp(`.(${compiler.config.ext.header.join('|')})$`);
    const moduleRegex = new RegExp(`.(${compiler.config.ext.module.join('|')})$`);
    const dependPackageNames = compiler.config.getAllDependencies();

    const params = `{
        ...config,
        env: {...${env}, ...config.env},
        paths: {
            wasm: 'cpp.wasm',
            data: 'cpp.data.txt'
        }
    }`;

    const CppJs = `
export const Native = {};
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

            compiler.findOrCreateInterfaceFile(path);

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

            watch(compiler.config.paths.native);
        },
        async generateBundle() {
            compiler.createBridge();
            await compiler.createWasm({ cc: ['-O3'] });
            this.emitFile({
                type: 'asset',
                source: fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.js`),
                fileName: 'cpp.js',
            });
            this.emitFile({
                type: 'asset',
                source: fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`),
                fileName: 'cpp.wasm',
            });
            const dataFilePath = `${compiler.config.paths.temp}/${compiler.config.general.name}.data.txt`;
            if (fs.existsSync(dataFilePath)) {
                this.emitFile({
                    type: 'asset',
                    source: fs.readFileSync(dataFilePath),
                    fileName: 'cpp.data.txt',
                });
            }
            const isWatching = process.argv.includes('-w') || process.argv.includes('--watch');
            if (!isWatching) {
                // fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
            }
        },
    };
};

export default rollupCppjsPlugin;
