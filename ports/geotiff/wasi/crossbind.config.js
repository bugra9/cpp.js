import mergeConfig from '@crossbind/port-geotiff/mergeConfig.mjs';
import projWasi from '@crossbind/port-proj-wasi/crossbind.config.js';
import tiffWasi from '@crossbind/port-tiff-wasi/crossbind.config.js';
import zlibWasi from '@crossbind/port-zlib-wasi/crossbind.config.js';

export default mergeConfig({
    dependencies: [projWasi, tiffWasi, zlibWasi],
    paths: { config: import.meta.url },
});
