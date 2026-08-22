import mergeConfig from '@crossbind/port-spatialite/mergeConfig.mjs';
import geosWasi from '@crossbind/port-geos-wasi/crossbind.config.js';
import projWasi from '@crossbind/port-proj-wasi/crossbind.config.js';
import sqlite3Wasi from '@crossbind/port-sqlite3-wasi/crossbind.config.js';
import zlibWasi from '@crossbind/port-zlib-wasi/crossbind.config.js';
import iconvWasi from '@crossbind/port-iconv-wasi/crossbind.config.js';

export default mergeConfig({
    dependencies: [geosWasi, projWasi, sqlite3Wasi, zlibWasi, iconvWasi],
    paths: { config: import.meta.url },
});
