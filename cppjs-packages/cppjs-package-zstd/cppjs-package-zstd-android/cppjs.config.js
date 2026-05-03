export default {
    dependencies:[
    ],
    general: {
        name: 'zstd',
    },
    export: {
        type: 'cmake',
        libName: [
            'zstd'
        ],
    },
    paths: {
        config: import.meta.url,
        base: '../..',
        output: 'dist'
    }
};
