import Matrix from '@cpp.js/sample-lib-prebuilt-matrix-multithread/cppjs.config.js';

export default {
    general: {
        name: 'cppjs-sample-backend-nodejs-wasm-multithread',
    },
    dependencies: [
        Matrix,
    ],
    paths: {
        config: import.meta.url,
        base: '../..', /* Delete this line for create-cpp.js */
        output: 'dist',
    },
    build: {
        usePthread: true
    }
};
