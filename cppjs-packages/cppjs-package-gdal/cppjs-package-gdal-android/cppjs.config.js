import mergeConfig from '@cpp.js/package-gdal/mergeConfig.mjs';
import curlAndroid from '@cpp.js/package-curl-android/cppjs.config.js';
import expatAndroid from '@cpp.js/package-expat-android/cppjs.config.js';
import geosAndroid from '@cpp.js/package-geos-android/cppjs.config.js';
import geotiffAndroid from '@cpp.js/package-geotiff-android/cppjs.config.js';
import iconvAndroid from '@cpp.js/package-iconv-android/cppjs.config.js';
import jpegturboAndroid from '@cpp.js/package-jpegturbo-android/cppjs.config.js';
import zstdAndroid from '@cpp.js/package-zstd-android/cppjs.config.js';
import lercAndroid from '@cpp.js/package-lerc-android/cppjs.config.js';
import projAndroid from '@cpp.js/package-proj-android/cppjs.config.js';
import spatialiteAndroid from '@cpp.js/package-spatialite-android/cppjs.config.js';
import sqlite3Android from '@cpp.js/package-sqlite3-android/cppjs.config.js';
import tiffAndroid from '@cpp.js/package-tiff-android/cppjs.config.js';
import webpAndroid from '@cpp.js/package-webp-android/cppjs.config.js';
import zlibAndroid from '@cpp.js/package-zlib-android/cppjs.config.js';

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
