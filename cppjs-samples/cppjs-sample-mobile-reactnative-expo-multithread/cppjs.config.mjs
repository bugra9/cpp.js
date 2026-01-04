import Matrix from '@cpp.js/sample-lib-prebuilt-matrix-multithread/cppjs.config.js';

export default {
    dependencies: [
        Matrix,
    ],
    paths: {
        config: import.meta.url,
    },
    build: {
        usePthread: true
    }
};
