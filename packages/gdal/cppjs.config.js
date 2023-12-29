import getDirName from 'cpp.js/src/utils/getDirName.js';
import expat from 'cppjs-package-expat/cppjs.config.js';
import geos from 'cppjs-package-geos/cppjs.config.js';
import geotiff from 'cppjs-package-geotiff/cppjs.config.js';
import iconv from 'cppjs-package-iconv/cppjs.config.js';
import proj from 'cppjs-package-proj/cppjs.config.js';
import spatialite from 'cppjs-package-spatialite/cppjs.config.js';
import sqlite3 from 'cppjs-package-sqlite3/cppjs.config.js';
import tiff from 'cppjs-package-tiff/cppjs.config.js';
import webp from 'cppjs-package-webp/cppjs.config.js';
import zlib from 'cppjs-package-zlib/cppjs.config.js';

export default {
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
};
