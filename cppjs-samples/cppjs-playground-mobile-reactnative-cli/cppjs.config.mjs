import matrix from '@cpp.js/sample-lib-prebuilt-matrix/cppjs.config.js';
import curlAndroid from '@cpp.js/package-curl-android/cppjs.config.js';
import curlIos from '@cpp.js/package-curl-ios/cppjs.config.js';
import expatAndroid from '@cpp.js/package-expat-android/cppjs.config.js';
import expatIos from '@cpp.js/package-expat-ios/cppjs.config.js';
import gdalAndroid from '@cpp.js/package-gdal-android/cppjs.config.js';
import gdalIos from '@cpp.js/package-gdal-ios/cppjs.config.js';
import geosAndroid from '@cpp.js/package-geos-android/cppjs.config.js';
import geosIos from '@cpp.js/package-geos-ios/cppjs.config.js';
import geotiffAndroid from '@cpp.js/package-geotiff-android/cppjs.config.js';
import geotiffIos from '@cpp.js/package-geotiff-ios/cppjs.config.js';
import iconvAndroid from '@cpp.js/package-iconv-android/cppjs.config.js';
import iconvIos from '@cpp.js/package-iconv-ios/cppjs.config.js';
import opensslAndroid from '@cpp.js/package-openssl-android/cppjs.config.js';
import opensslIos from '@cpp.js/package-openssl-ios/cppjs.config.js';
import projAndroid from '@cpp.js/package-proj-android/cppjs.config.js';
import projIos from '@cpp.js/package-proj-ios/cppjs.config.js';
import spatialiteAndroid from '@cpp.js/package-spatialite-android/cppjs.config.js';
import spatialiteIos from '@cpp.js/package-spatialite-ios/cppjs.config.js';
import sqlite3Android from '@cpp.js/package-sqlite3-android/cppjs.config.js';
import sqlite3Ios from '@cpp.js/package-sqlite3-ios/cppjs.config.js';
import tiffAndroid from '@cpp.js/package-tiff-android/cppjs.config.js';
import tiffIos from '@cpp.js/package-tiff-ios/cppjs.config.js';
import webpAndroid from '@cpp.js/package-webp-android/cppjs.config.js';
import webpIos from '@cpp.js/package-webp-ios/cppjs.config.js';
import zlibAndroid from '@cpp.js/package-zlib-android/cppjs.config.js';
import zlibIos from '@cpp.js/package-zlib-ios/cppjs.config.js';

export default {
    dependencies: [
        matrix,
        curlAndroid,
        curlIos,
        expatAndroid,
        expatIos,
        gdalAndroid,
        gdalIos,
        geosAndroid,
        geosIos,
        geotiffAndroid,
        geotiffIos,
        iconvAndroid,
        iconvIos,
        opensslAndroid,
        opensslIos,
        projAndroid,
        projIos,
        spatialiteAndroid,
        spatialiteIos,
        sqlite3Android,
        sqlite3Ios,
        tiffAndroid,
        tiffIos,
        webpAndroid,
        webpIos,
        zlibAndroid,
        zlibIos,
    ],
    paths: {
        config: import.meta.url,
        base: '../..', /* Delete this line for create-cpp.js */
    }
}
