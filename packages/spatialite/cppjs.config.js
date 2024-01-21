import getDirName from 'cpp.js/src/utils/getDirName.js';
import geos from 'cppjs-package-geos/cppjs.config.js';
import proj from 'cppjs-package-proj/cppjs.config.js';
import sqlite3 from 'cppjs-package-sqlite3/cppjs.config.js';
import zlib from 'cppjs-package-zlib/cppjs.config.js';

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
    ],
    paths: {
        base: '../..',
        project: getDirName(import.meta.url),
        output: 'dist',
    },
};
