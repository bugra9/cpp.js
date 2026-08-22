import mergeConfig from '@crossbind/port-gdal/mergeConfig.mjs';
import curlWasm from '@crossbind/port-curl-wasm/crossbind.config.js';
import expatWasm from '@crossbind/port-expat-wasm/crossbind.config.js';
import geosWasm from '@crossbind/port-geos-wasm/crossbind.config.js';
import geotiffWasm from '@crossbind/port-geotiff-wasm/crossbind.config.js';
import iconvWasm from '@crossbind/port-iconv-wasm/crossbind.config.js';
import jpegturboWasm from '@crossbind/port-jpegturbo-wasm/crossbind.config.js';
import zstdWasm from '@crossbind/port-zstd-wasm/crossbind.config.js';
import lercWasm from '@crossbind/port-lerc-wasm/crossbind.config.js';
import projWasm from '@crossbind/port-proj-wasm/crossbind.config.js';
import spatialiteWasm from '@crossbind/port-spatialite-wasm/crossbind.config.js';
import sqlite3Wasm from '@crossbind/port-sqlite3-wasm/crossbind.config.js';
import tiffWasm from '@crossbind/port-tiff-wasm/crossbind.config.js';
import webpWasm from '@crossbind/port-webp-wasm/crossbind.config.js';
import zlibWasm from '@crossbind/port-zlib-wasm/crossbind.config.js';

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
