export default {
    general: {
        name: 'cppjs-sample-lib-prebuilt-matrix',
    },
    export: {
        type: 'cmake',
    },
    paths: {
        config: import.meta.url,
        base: '../..',
        output: 'dist',
    },
};
