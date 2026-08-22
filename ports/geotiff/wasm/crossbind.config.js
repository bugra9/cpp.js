import mergeConfig from '@crossbind/port-geotiff/mergeConfig.mjs';
import projWasm from '@crossbind/port-proj-wasm/crossbind.config.js';
import tiffWasm from '@crossbind/port-tiff-wasm/crossbind.config.js';
import zlibWasm from '@crossbind/port-zlib-wasm/crossbind.config.js';
import jpegturboWasm from '@crossbind/port-jpegturbo-wasm/crossbind.config.js';

export default mergeConfig({
    dependencies: [projWasm, tiffWasm, zlibWasm, jpegturboWasm],
    paths: { config: import.meta.url },
});
