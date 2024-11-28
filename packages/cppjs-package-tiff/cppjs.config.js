import zlib from '@cpp.js/package-zlib/cppjs.config.js';

export default {
    general: {
        name: 'tiff',
    },
    export: {
        type: 'cmake',
    },
    dependencies: [
        zlib,
    ],
    paths: {
        config: import.meta.url,
        base: '../..',
        output: 'dist',
    },
};
