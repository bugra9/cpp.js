import getDirName from 'cpp.js/src/utils/getDirName.js';
import tiff from 'cppjs-package-tiff/cppjs.config.js';
import sqlite3 from 'cppjs-package-sqlite3/cppjs.config.js';

export default {
    general: {
        name: 'proj',
    },
    export: {
        type: 'cmake',
    },
    dependencies: [
        tiff,
        sqlite3,
    ],
    paths: {
        base: '../..',
        project: getDirName(import.meta.url),
        output: 'dist',
    },
    platform: {
        'Emscripten-x86_64': {
            data: {
                'share/proj': '/usr/share/proj',
            },
        },
    },
};
