import mergeConfig from '@cpp.js/package-proj/mergeConfig.mjs';
import tiffWasm from '@cpp.js/package-tiff-wasm/cppjs.config.js';
import sqlite3Wasm from '@cpp.js/package-sqlite3-wasm/cppjs.config.js';

export default mergeConfig({
    dependencies: [tiffWasm, sqlite3Wasm],
    paths: { config: import.meta.url },
});
