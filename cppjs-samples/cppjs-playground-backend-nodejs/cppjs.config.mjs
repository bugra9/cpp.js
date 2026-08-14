import matrix from '@cpp.js/sample-lib-prebuilt-matrix/cppjs.config.js';
import embindRustDemo from '@cpp.js/embind-rust-demo/cppjs.config.mjs';
import curl from '@cpp.js/package-curl-wasm/cppjs.config.js';
import expat from '@cpp.js/package-expat-wasm/cppjs.config.js';
import gdal from '@cpp.js/package-gdal-wasm/cppjs.config.js';
import geos from '@cpp.js/package-geos-wasm/cppjs.config.js';
import geotiff from '@cpp.js/package-geotiff-wasm/cppjs.config.js';
import iconv from '@cpp.js/package-iconv-wasm/cppjs.config.js';
import openssl from '@cpp.js/package-openssl-wasm/cppjs.config.js';
import proj from '@cpp.js/package-proj-wasm/cppjs.config.js';
import spatialite from '@cpp.js/package-spatialite-wasm/cppjs.config.js';
import sqlite3 from '@cpp.js/package-sqlite3-wasm/cppjs.config.js';
import tiff from '@cpp.js/package-tiff-wasm/cppjs.config.js';
import webp from '@cpp.js/package-webp-wasm/cppjs.config.js';
import zlib from '@cpp.js/package-zlib-wasm/cppjs.config.js';

export default {
    general: {
        name: 'cppjs-sample-backend-nodejs-wasm',
    },
    dependencies: [
        matrix,
        embindRustDemo,
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
        // Standalone builds bridge every header on this list; the conformance kit's C++
        // surface rides along from its own workspace package.
        header: ['src/native', '../cppjs-conformance/native'],
        output: 'dist',
    },
    targetSpecs: [
        {
            platform: 'wasm',
            specs: {
                binary: {
                    emccFlags: ['-sJSPI'],
                }
            }
        }
    ],
};
