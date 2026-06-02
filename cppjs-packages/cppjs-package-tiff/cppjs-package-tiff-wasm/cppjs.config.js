import mergeConfig from '@cpp.js/package-tiff/mergeConfig.mjs';
import zlibWasm from '@cpp.js/package-zlib-wasm/cppjs.config.js';
import jpegturboWasm from '@cpp.js/package-jpegturbo-wasm/cppjs.config.js';
import zstdWasm from '@cpp.js/package-zstd-wasm/cppjs.config.js';
import lercWasm from '@cpp.js/package-lerc-wasm/cppjs.config.js';

export default mergeConfig({
    dependencies: [zlibWasm, jpegturboWasm, zstdWasm, lercWasm],
    paths: { config: import.meta.url },
});
