import mergeConfig from '@cpp.js/package-gdal/mergeConfig.mjs';
import curlWasm from '@cpp.js/package-curl-wasm/cppjs.config.js';
import expatWasm from '@cpp.js/package-expat-wasm/cppjs.config.js';
import geosWasm from '@cpp.js/package-geos-wasm/cppjs.config.js';
import geotiffWasm from '@cpp.js/package-geotiff-wasm/cppjs.config.js';
import iconvWasm from '@cpp.js/package-iconv-wasm/cppjs.config.js';
import jpegturboWasm from '@cpp.js/package-jpegturbo-wasm/cppjs.config.js';
import zstdWasm from '@cpp.js/package-zstd-wasm/cppjs.config.js';
import lercWasm from '@cpp.js/package-lerc-wasm/cppjs.config.js';
import projWasm from '@cpp.js/package-proj-wasm/cppjs.config.js';
import spatialiteWasm from '@cpp.js/package-spatialite-wasm/cppjs.config.js';
import sqlite3Wasm from '@cpp.js/package-sqlite3-wasm/cppjs.config.js';
import tiffWasm from '@cpp.js/package-tiff-wasm/cppjs.config.js';
import webpWasm from '@cpp.js/package-webp-wasm/cppjs.config.js';
import zlibWasm from '@cpp.js/package-zlib-wasm/cppjs.config.js';

export default mergeConfig({
    dependencies: [
    curlWasm,
    expatWasm,
    geosWasm,
    geotiffWasm,
    iconvWasm,
    jpegturboWasm,
    zstdWasm,
    lercWasm,
    projWasm,
    spatialiteWasm,
    sqlite3Wasm,
    tiffWasm,
    webpWasm,
    zlibWasm,
    ],
    paths: { config: import.meta.url },
});
