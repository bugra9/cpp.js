import mergeConfig from '@cpp.js/package-gdal/mergeConfig.mjs';
import geotiffWasi from '@cpp.js/package-geotiff-wasi/cppjs.config.js';
import projWasi from '@cpp.js/package-proj-wasi/cppjs.config.js';
import tiffWasi from '@cpp.js/package-tiff-wasi/cppjs.config.js';
import sqlite3Wasi from '@cpp.js/package-sqlite3-wasi/cppjs.config.js';
import zlibWasi from '@cpp.js/package-zlib-wasi/cppjs.config.js';
// curl brings openssl and its certs data transitively, and flips GDAL_USE_CURL on in the recipe.
import curlWasi from '@cpp.js/package-curl-wasi/cppjs.config.js';

export default mergeConfig({
    dependencies: [geotiffWasi, projWasi, tiffWasi, sqlite3Wasi, zlibWasi, curlWasi],
    paths: { config: import.meta.url },
});
