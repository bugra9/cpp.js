import Metro from 'metro';
import CppjsCompiler from 'cpp.js';

const compiler = new CppjsCompiler();
const config = await Metro.loadConfig();
// config.cacheStores.forEach((cache) => cache.clear());
const platform = process.argv.length === 3 ? process.argv[2] : 'web';
await Metro.runBuild(config, {
    entry: 'index.js',
    platform,
    minify: true,
    out: `${compiler.config.paths.temp}/metro-${platform}.js`,
});
