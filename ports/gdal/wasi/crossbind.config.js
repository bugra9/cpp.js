import mergeConfig from '@crossbind/port-gdal/mergeConfig.mjs';
import geotiffWasi from '@crossbind/port-geotiff-wasi/crossbind.config.js';
import projWasi from '@crossbind/port-proj-wasi/crossbind.config.js';
import tiffWasi from '@crossbind/port-tiff-wasi/crossbind.config.js';
import sqlite3Wasi from '@crossbind/port-sqlite3-wasi/crossbind.config.js';
import zlibWasi from '@crossbind/port-zlib-wasi/crossbind.config.js';
// curl brings openssl and its certs data transitively, and flips GDAL_USE_CURL on in the recipe.
import curlWasi from '@crossbind/port-curl-wasi/crossbind.config.js';

export default mergeConfig({
    dependencies: [geotiffWasi, projWasi, tiffWasi, sqlite3Wasi, zlibWasi, curlWasi],
    paths: { config: import.meta.url },
});
