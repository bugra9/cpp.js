import curl from '@cpp.js/package-curl-multithread/cppjs.config.js';
import expat from '@cpp.js/package-expat-multithread/cppjs.config.js';
import gdal from '@cpp.js/package-gdal-multithread/cppjs.config.js';
import geos from '@cpp.js/package-geos-multithread/cppjs.config.js';
import geotiff from '@cpp.js/package-geotiff-multithread/cppjs.config.js';
import iconv from '@cpp.js/package-iconv-multithread/cppjs.config.js';
import openssl from '@cpp.js/package-openssl-multithread/cppjs.config.js';
import proj from '@cpp.js/package-proj-multithread/cppjs.config.js';
import spatialite from '@cpp.js/package-spatialite-multithread/cppjs.config.js';
import sqlite3 from '@cpp.js/package-sqlite3-multithread/cppjs.config.js';
import tiff from '@cpp.js/package-tiff-multithread/cppjs.config.js';
import webp from '@cpp.js/package-webp-multithread/cppjs.config.js';
import zlib from '@cpp.js/package-zlib-multithread/cppjs.config.js';

export default {
    general: {
        name: 'cppjs-sample-backend-nodejs-wasm',
    },
    dependencies: [
        curl,
        expat,
        gdal,
        geos,
        geotiff,
        iconv,
        openssl,
        proj,
        spatialite,
        sqlite3,
        tiff,
        webp,
        zlib,
    ],
    paths: {
        config: import.meta.url,
        base: '../..', /* Delete this line for create-cpp.js */
        output: 'dist',
    },
    platform: {
        'Emscripten-x86_64': {
            binary: {
                emccFlags: ['-sJSPI'],
            }
        },
    }
};
