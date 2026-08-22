import mergeConfig from '@crossbind/port-gdal/mergeConfig.mjs';
import curlIos from '@crossbind/port-curl-ios/crossbind.config.js';
import expatIos from '@crossbind/port-expat-ios/crossbind.config.js';
import geosIos from '@crossbind/port-geos-ios/crossbind.config.js';
import geotiffIos from '@crossbind/port-geotiff-ios/crossbind.config.js';
import iconvIos from '@crossbind/port-iconv-ios/crossbind.config.js';
import jpegturboIos from '@crossbind/port-jpegturbo-ios/crossbind.config.js';
import zstdIos from '@crossbind/port-zstd-ios/crossbind.config.js';
import lercIos from '@crossbind/port-lerc-ios/crossbind.config.js';
import projIos from '@crossbind/port-proj-ios/crossbind.config.js';
import spatialiteIos from '@crossbind/port-spatialite-ios/crossbind.config.js';
import sqlite3Ios from '@crossbind/port-sqlite3-ios/crossbind.config.js';
import tiffIos from '@crossbind/port-tiff-ios/crossbind.config.js';
import webpIos from '@crossbind/port-webp-ios/crossbind.config.js';
import zlibIos from '@crossbind/port-zlib-ios/crossbind.config.js';

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
