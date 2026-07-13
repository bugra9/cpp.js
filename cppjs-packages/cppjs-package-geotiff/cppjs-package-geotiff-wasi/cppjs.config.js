import mergeConfig from '@cpp.js/package-geotiff/mergeConfig.mjs';
import projWasi from '@cpp.js/package-proj-wasi/cppjs.config.js';
import tiffWasi from '@cpp.js/package-tiff-wasi/cppjs.config.js';
import zlibWasi from '@cpp.js/package-zlib-wasi/cppjs.config.js';

export default mergeConfig({
    dependencies: [projWasi, tiffWasi, zlibWasi],
    paths: { config: import.meta.url },
});
