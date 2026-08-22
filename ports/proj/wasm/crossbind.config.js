import mergeConfig from '@crossbind/port-proj/mergeConfig.mjs';
import tiffWasm from '@crossbind/port-tiff-wasm/crossbind.config.js';
import sqlite3Wasm from '@crossbind/port-sqlite3-wasm/crossbind.config.js';

export default mergeConfig({
    dependencies: [tiffWasm, sqlite3Wasm],
    paths: { config: import.meta.url },
});
