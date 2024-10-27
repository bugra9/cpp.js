import getDirName from 'cpp.js/src/utils/getDirName.js';
import geos from '@cpp.js/package-geos/cppjs.config.js';
import proj from '@cpp.js/package-proj/cppjs.config.js';
import sqlite3 from '@cpp.js/package-sqlite3/cppjs.config.js';
import zlib from '@cpp.js/package-zlib/cppjs.config.js';
import iconv from '@cpp.js/package-iconv/cppjs.config.js';

export default {
    general: {
        name: 'spatialite',
    },
    export: {
        type: 'cmake',
    },
    dependencies: [
        geos,
        proj,
        sqlite3,
        zlib,
        iconv,
    ],
    paths: {
        base: '../..',
        project: getDirName(import.meta.url),
        output: 'dist',
    },
};
