/* eslint-disable import/no-unresolved */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-empty */
import Metro from 'metro';
import CppjsCompiler from 'cpp.js';
import upath from 'upath';
import fs from 'node:fs';

let exportEmbedAsync;
let resolveOptions;
let isExpo = false;

try {
    const exportEmbedAsyncJS = (await import('@expo/cli/build/src/export/embed/exportEmbedAsync.js')).default;
    const resolveOptionsJS = (await import('@expo/cli/build/src/export/embed/resolveOptions.js')).default;
    exportEmbedAsync = exportEmbedAsyncJS.exportEmbedAsync;
    resolveOptions = resolveOptionsJS.resolveOptions;
    isExpo = !!exportEmbedAsync && !!resolveOptions;
} catch (e) {}

const compiler = new CppjsCompiler();
const modulePath = compiler.config.package.main ? getModulePath(compiler.config.package.main) : null;
const entry = modulePath ? upath.relative(compiler.config.paths.project, modulePath) : 'index.js';

const config = await Metro.loadConfig();
const platform = process.argv.length === 3 ? process.argv[2] : 'web';

if (isExpo) {
    const options = await resolveOptions({
        '--entry-file': entry,
        '--bundle-output': `${compiler.config.paths.temp}/metro-${platform}.js`,
        '--platform': platform,
    }, { args: {} });
    await exportEmbedAsync(compiler.config.paths.project, options);
} else {
    await Metro.runBuild(config, {
        entry,
        platform,
        minify: true,
        dev: false,
        sourceMap: false,
        out: `${compiler.config.paths.temp}/metro-${platform}.js`,
    });
}

function getModulePath(moduleName) {
    const resolvedPath = import.meta.resolve(moduleName).replace('file://', '');
    const extensions = ['.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx'];

    for (const ext of extensions) {
        const fullPath = resolvedPath + ext;
        if (fs.existsSync(fullPath)) {
            return fullPath;
        }
    }
    return null;
}
