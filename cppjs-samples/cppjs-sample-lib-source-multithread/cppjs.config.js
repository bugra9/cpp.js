import Matrix from '@cpp.js/sample-lib-prebuilt-matrix-multithread/cppjs.config.js';


export default {
    export: {
        type: 'source',
    },
    paths: {
        config: import.meta.url,
    },
    dependencies: [
        Matrix,
    ],
    build: {
        usePthread: true
    }
};
