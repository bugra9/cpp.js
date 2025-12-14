import zlib from '@cpp.js/package-zlib-wasm-multithread/cppjs.config.js';

export default {
    general: {
        name: 'sqlite3',
    },
    export: {
        type: 'cmake',
    },
    build: {
        usePthread: true,
    },
    dependencies: [
        zlib,
    ],
    paths: {
        config: import.meta.url,
        base: '../..',
        output: 'dist',
    }
};
