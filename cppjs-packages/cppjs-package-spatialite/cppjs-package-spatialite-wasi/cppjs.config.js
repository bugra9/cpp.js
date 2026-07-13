import mergeConfig from '@cpp.js/package-spatialite/mergeConfig.mjs';
import geosWasi from '@cpp.js/package-geos-wasi/cppjs.config.js';
import projWasi from '@cpp.js/package-proj-wasi/cppjs.config.js';
import sqlite3Wasi from '@cpp.js/package-sqlite3-wasi/cppjs.config.js';
import zlibWasi from '@cpp.js/package-zlib-wasi/cppjs.config.js';
import iconvWasi from '@cpp.js/package-iconv-wasi/cppjs.config.js';

export default mergeConfig({
    dependencies: [geosWasi, projWasi, sqlite3Wasi, zlibWasi, iconvWasi],
    paths: { config: import.meta.url },
});
