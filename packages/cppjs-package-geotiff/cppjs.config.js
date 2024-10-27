import getDirName from 'cpp.js/src/utils/getDirName.js';
import proj from '@cpp.js/package-proj/cppjs.config.js';
import tiff from '@cpp.js/package-tiff/cppjs.config.js';
import zlib from '@cpp.js/package-zlib/cppjs.config.js';

export default {
    general: {
        name: 'geotiff',
    },
    export: {
        type: 'cmake',
    },
    dependencies: [
        proj,
        tiff,
        zlib,
    ],
    paths: {
        base: '../..',
        project: getDirName(import.meta.url),
        output: 'dist',
    },
};
