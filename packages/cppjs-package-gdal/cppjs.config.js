import getDirName from 'cpp.js/src/utils/getDirName.js';
import expat from '@cpp.js/package-expat/cppjs.config.js';
import geos from '@cpp.js/package-geos/cppjs.config.js';
import geotiff from '@cpp.js/package-geotiff/cppjs.config.js';
import iconv from '@cpp.js/package-iconv/cppjs.config.js';
import proj from '@cpp.js/package-proj/cppjs.config.js';
import spatialite from '@cpp.js/package-spatialite/cppjs.config.js';
import sqlite3 from '@cpp.js/package-sqlite3/cppjs.config.js';
import tiff from '@cpp.js/package-tiff/cppjs.config.js';
import webp from '@cpp.js/package-webp/cppjs.config.js';
import zlib from '@cpp.js/package-zlib/cppjs.config.js';

export default {
    general: {
        name: 'gdal',
    },
    export: {
        type: 'cmake',
    },
    dependencies: [
        expat,
        geos,
        geotiff,
        iconv,
        proj,
        spatialite,
        sqlite3,
        tiff,
        webp,
        zlib,
    ],
    paths: {
        base: '../..',
        project: getDirName(import.meta.url),
        output: 'dist',
    },
    platform: {
        'Android-arm64-v8a': {
            data: {
                'share/gdal': 'gdal',
            },
            env: {
                GDAL_DATA: '_CPPJS_DATA_PATH_/gdal',
                DXF_FEATURE_LIMIT_PER_BLOCK: '-1',
                GDAL_ENABLE_DEPRECATED_DRIVER_GTM: 'YES',
                // CPL_DEBUG: 'ON',
                CPL_LOG_ERRORS: 'ON',
            },
        },
        'iOS-iphoneos': {
            data: {
                'share/gdal': 'gdal',
            },
            env: {
                GDAL_DATA: '_CPPJS_DATA_PATH_/gdal',
                DXF_FEATURE_LIMIT_PER_BLOCK: '-1',
                GDAL_ENABLE_DEPRECATED_DRIVER_GTM: 'YES',
                // CPL_DEBUG: 'ON',
                CPL_LOG_ERRORS: 'ON',
            },
        },
        'Emscripten-x86_64-browser': {
            data: {
                'share/gdal': '/usr/share/gdal',
            },
            env: {
                GDAL_DATA: '/usr/share/gdal',
                DXF_FEATURE_LIMIT_PER_BLOCK: '-1',
                GDAL_NUM_THREADS: '0',
                GDAL_ENABLE_DEPRECATED_DRIVER_GTM: 'YES',
                // CPL_DEBUG: 'ON',
                CPL_LOG_ERRORS: 'ON',
            },
        },
        'Emscripten-x86_64-node': {
            data: {
                'share/gdal': 'gdal',
            },
            env: {
                GDAL_DATA: '_CPPJS_DATA_PATH_/gdal',
                DXF_FEATURE_LIMIT_PER_BLOCK: '-1',
                GDAL_NUM_THREADS: '0',
                GDAL_ENABLE_DEPRECATED_DRIVER_GTM: 'YES',
                // CPL_DEBUG: 'ON',
                CPL_LOG_ERRORS: 'ON',
            },
        },
    },
};
