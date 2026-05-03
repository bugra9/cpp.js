export default {
    dependencies:[
    ],
    general: {
        name: 'Lerc',
    },
    export: {
        type: 'cmake',
        libName: [
            'Lerc'
        ],
    },
    paths: {
        config: import.meta.url,
        base: '../..',
        output: 'dist'
    }
};
