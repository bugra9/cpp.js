import getDirName from 'cpp.js/src/utils/getDirName.js';
import zlib from 'cppjs-package-zlib/cppjs.config.js';

export default {
    general: {
        name: 'sqlite3',
    },
    export: {
        type: 'cmake',
    },
    dependencies: [
        zlib,
    ],
    paths: {
        base: '../..',
        project: getDirName(import.meta.url),
        output: 'dist',
    },
};
