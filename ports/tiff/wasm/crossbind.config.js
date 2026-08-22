import mergeConfig from '@crossbind/port-tiff/mergeConfig.mjs';
import zlibWasm from '@crossbind/port-zlib-wasm/crossbind.config.js';
import jpegturboWasm from '@crossbind/port-jpegturbo-wasm/crossbind.config.js';
import zstdWasm from '@crossbind/port-zstd-wasm/crossbind.config.js';
import lercWasm from '@crossbind/port-lerc-wasm/crossbind.config.js';

export default mergeConfig({
    dependencies: [zlibWasm, jpegturboWasm, zstdWasm, lercWasm],
    paths: { config: import.meta.url },
});
