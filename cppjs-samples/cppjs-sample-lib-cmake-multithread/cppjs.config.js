import Matrix from '@cpp.js/sample-lib-prebuilt-matrix-multithread/cppjs.config.js';

export default {
    export: {
        type: 'cmake',
    },
    paths: {
        config: import.meta.url,
        output: '.',
    },
    dependencies: [
        Matrix,
    ],
    build: {
        usePthread: true
    }
};
