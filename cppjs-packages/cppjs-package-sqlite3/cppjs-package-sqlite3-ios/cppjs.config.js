import zlib from '@cpp.js/package-zlib-ios/cppjs.config.js';

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
        config: import.meta.url,
        base: '../..',
        output: 'dist',
    },
};
