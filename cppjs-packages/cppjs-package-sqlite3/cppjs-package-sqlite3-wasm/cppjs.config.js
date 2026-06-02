import mergeConfig from '@cpp.js/package-sqlite3/mergeConfig.mjs';
import zlibWasm from '@cpp.js/package-zlib-wasm/cppjs.config.js';

export default mergeConfig({
    dependencies: [zlibWasm],
    paths: { config: import.meta.url },
});
