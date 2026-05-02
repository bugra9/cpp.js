import Matrix from '@cpp.js/sample-lib-prebuilt-matrix-multithread/cppjs.config.js';

export default {
    general: {
        name: 'cppjs-sample-web-next-webpack-multithread',
    },
    dependencies: [
        Matrix,
    ],
    paths: {
        config: import.meta.url,
        base: '../..', /* Delete this line for create-cpp.js */
        native: ['app/native'],
    },
    build: {
        usePthread: true
    }
};
