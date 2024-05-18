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
        'Emscripten-x86_64-browser': {
            data: {
                'share/proj': '/usr/share/proj',
            },
            env: {
                PROJ_LIB: '/usr/share/proj',
            },
        },
        'Emscripten-x86_64-node': {
            data: {
                'share/proj': 'proj',
            },
            env: {
                PROJ_LIB: '_CPPJS_DATA_PATH_/proj',
            },
        },
        'Android-arm64-v8a': {
            data: {
                'share/proj': 'proj',
            },
            env: {
                PROJ_LIB: '_CPPJS_DATA_PATH_/proj',
            },
        },
        'iOS-iphoneos': {
            data: {
                'share/proj': 'proj',
            },
            env: {
                PROJ_LIB: '_CPPJS_DATA_PATH_/proj',
            },
        },
    },
};
