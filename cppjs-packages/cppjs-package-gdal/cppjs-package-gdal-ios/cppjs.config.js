import mergeConfig from '@cpp.js/package-gdal/mergeConfig.mjs';
import curlIos from '@cpp.js/package-curl-ios/cppjs.config.js';
import expatIos from '@cpp.js/package-expat-ios/cppjs.config.js';
import geosIos from '@cpp.js/package-geos-ios/cppjs.config.js';
import geotiffIos from '@cpp.js/package-geotiff-ios/cppjs.config.js';
import iconvIos from '@cpp.js/package-iconv-ios/cppjs.config.js';
import jpegturboIos from '@cpp.js/package-jpegturbo-ios/cppjs.config.js';
import zstdIos from '@cpp.js/package-zstd-ios/cppjs.config.js';
import lercIos from '@cpp.js/package-lerc-ios/cppjs.config.js';
import projIos from '@cpp.js/package-proj-ios/cppjs.config.js';
import spatialiteIos from '@cpp.js/package-spatialite-ios/cppjs.config.js';
import sqlite3Ios from '@cpp.js/package-sqlite3-ios/cppjs.config.js';
import tiffIos from '@cpp.js/package-tiff-ios/cppjs.config.js';
import webpIos from '@cpp.js/package-webp-ios/cppjs.config.js';
import zlibIos from '@cpp.js/package-zlib-ios/cppjs.config.js';

export default mergeConfig({
    dependencies: [
    curlIos,
    expatIos,
    geosIos,
    geotiffIos,
    iconvIos,
    jpegturboIos,
    zstdIos,
    lercIos,
    projIos,
    spatialiteIos,
    sqlite3Ios,
    tiffIos,
    webpIos,
    zlibIos,
    ],
    paths: { config: import.meta.url },
});
