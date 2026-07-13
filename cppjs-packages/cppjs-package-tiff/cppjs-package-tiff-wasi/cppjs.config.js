import mergeConfig from '@cpp.js/package-tiff/mergeConfig.mjs';
import zlibWasi from '@cpp.js/package-zlib-wasi/cppjs.config.js';

export default mergeConfig({
    dependencies: [zlibWasi],
    paths: { config: import.meta.url },
});
