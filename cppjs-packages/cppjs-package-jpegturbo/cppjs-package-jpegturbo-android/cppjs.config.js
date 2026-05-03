export default {
    dependencies:[
    ],
    general: {
        name: 'jpeg',
    },
    export: {
        type: 'cmake',
        libName: [
            'jpeg'
        ],
    },
    paths: {
        config: import.meta.url,
        base: '../..',
        output: 'dist'
    }
};
