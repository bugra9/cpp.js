import mergeConfig from '@crossbind/port-proj/mergeConfig.mjs';
import tiffWasi from '@crossbind/port-tiff-wasi/crossbind.config.js';
import sqlite3Wasi from '@crossbind/port-sqlite3-wasi/crossbind.config.js';

export default mergeConfig({
    dependencies: [tiffWasi, sqlite3Wasi],
    paths: { config: import.meta.url },
});
