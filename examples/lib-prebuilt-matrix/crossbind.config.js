export default {
    general: {
        name: 'crossbind-example-lib-prebuilt-matrix',
    },
    types: true,
    export: {
        type: 'cmake',
    },
    paths: {
        config: import.meta.url,
        base: '../..', /* Delete this line for create-crossbind */
        output: 'dist',
    },
};
