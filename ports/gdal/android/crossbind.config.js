import mergeConfig from '@crossbind/port-gdal/mergeConfig.mjs';
import curlAndroid from '@crossbind/port-curl-android/crossbind.config.js';
import expatAndroid from '@crossbind/port-expat-android/crossbind.config.js';
import geosAndroid from '@crossbind/port-geos-android/crossbind.config.js';
import geotiffAndroid from '@crossbind/port-geotiff-android/crossbind.config.js';
import iconvAndroid from '@crossbind/port-iconv-android/crossbind.config.js';
import jpegturboAndroid from '@crossbind/port-jpegturbo-android/crossbind.config.js';
import zstdAndroid from '@crossbind/port-zstd-android/crossbind.config.js';
import lercAndroid from '@crossbind/port-lerc-android/crossbind.config.js';
import projAndroid from '@crossbind/port-proj-android/crossbind.config.js';
import spatialiteAndroid from '@crossbind/port-spatialite-android/crossbind.config.js';
import sqlite3Android from '@crossbind/port-sqlite3-android/crossbind.config.js';
import tiffAndroid from '@crossbind/port-tiff-android/crossbind.config.js';
import webpAndroid from '@crossbind/port-webp-android/crossbind.config.js';
import zlibAndroid from '@crossbind/port-zlib-android/crossbind.config.js';

export default mergeConfig({
    dependencies: [
        curlAndroid,
        expatAndroid,
        geosAndroid,
        geotiffAndroid,
        iconvAndroid,
        jpegturboAndroid,
        zstdAndroid,
        lercAndroid,
        projAndroid,
        spatialiteAndroid,
        sqlite3Android,
        tiffAndroid,
        webpAndroid,
        zlibAndroid,
    ],
    paths: { config: import.meta.url },
});
