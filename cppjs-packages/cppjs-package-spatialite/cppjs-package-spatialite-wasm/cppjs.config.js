import mergeConfig from '@cpp.js/package-spatialite/mergeConfig.mjs';
import geosWasm from '@cpp.js/package-geos-wasm/cppjs.config.js';
import projWasm from '@cpp.js/package-proj-wasm/cppjs.config.js';
import sqlite3Wasm from '@cpp.js/package-sqlite3-wasm/cppjs.config.js';
import zlibWasm from '@cpp.js/package-zlib-wasm/cppjs.config.js';
import iconvWasm from '@cpp.js/package-iconv-wasm/cppjs.config.js';

export default mergeConfig({
    dependencies: [geosWasm, projWasm, sqlite3Wasm, zlibWasm, iconvWasm],
    paths: { config: import.meta.url },
});
