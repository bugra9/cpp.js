import getDirName from 'cpp.js/src/utils/getDirName.js';
import proj from 'cppjs-package-proj/cppjs.config.js';
import tiff from 'cppjs-package-tiff/cppjs.config.js';
import zlib from 'cppjs-package-zlib/cppjs.config.js';

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
