export default {
    general: {
        name: 'cppjs-sample-lib-prebuilt-matrix',
    },
    types: true,
    export: {
        type: 'cmake',
    },
    paths: {
        config: import.meta.url,
        base: '../..', /* Delete this line for create-cpp.js */
        output: 'dist',
    },
};
