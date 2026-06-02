import mergeConfig from '@cpp.js/package-geotiff/mergeConfig.mjs';
import projWasm from '@cpp.js/package-proj-wasm/cppjs.config.js';
import tiffWasm from '@cpp.js/package-tiff-wasm/cppjs.config.js';
import zlibWasm from '@cpp.js/package-zlib-wasm/cppjs.config.js';
import jpegturboWasm from '@cpp.js/package-jpegturbo-wasm/cppjs.config.js';

export default mergeConfig({
    dependencies: [projWasm, tiffWasm, zlibWasm, jpegturboWasm],
    paths: { config: import.meta.url },
});
