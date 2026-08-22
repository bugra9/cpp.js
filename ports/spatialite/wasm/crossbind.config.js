import mergeConfig from '@crossbind/port-spatialite/mergeConfig.mjs';
import geosWasm from '@crossbind/port-geos-wasm/crossbind.config.js';
import projWasm from '@crossbind/port-proj-wasm/crossbind.config.js';
import sqlite3Wasm from '@crossbind/port-sqlite3-wasm/crossbind.config.js';
import zlibWasm from '@crossbind/port-zlib-wasm/crossbind.config.js';
import iconvWasm from '@crossbind/port-iconv-wasm/crossbind.config.js';

export default mergeConfig({
    dependencies: [geosWasm, projWasm, sqlite3Wasm, zlibWasm, iconvWasm],
    paths: { config: import.meta.url },
});
