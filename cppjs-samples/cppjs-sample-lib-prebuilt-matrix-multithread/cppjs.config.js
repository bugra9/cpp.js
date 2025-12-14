export default {
    general: {
        name: 'cppjs-sample-lib-prebuilt-matrix-multithread',
    },
    build: {
        usePthread: true
    },
    export: {
        type: 'cmake',
    },
    paths: {
        config: import.meta.url,
        base: '../..', /* Delete this line for create-cpp.js */
        output: 'dist',
    },
};
