import mergeConfig from '@crossbind/port-tiff/mergeConfig.mjs';
import zlibWasi from '@crossbind/port-zlib-wasi/crossbind.config.js';

export default mergeConfig({
    dependencies: [zlibWasi],
    paths: { config: import.meta.url },
});
