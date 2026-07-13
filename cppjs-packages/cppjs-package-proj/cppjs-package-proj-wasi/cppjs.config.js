import mergeConfig from '@cpp.js/package-proj/mergeConfig.mjs';
import tiffWasi from '@cpp.js/package-tiff-wasi/cppjs.config.js';
import sqlite3Wasi from '@cpp.js/package-sqlite3-wasi/cppjs.config.js';

export default mergeConfig({
    dependencies: [tiffWasi, sqlite3Wasi],
    paths: { config: import.meta.url },
});
