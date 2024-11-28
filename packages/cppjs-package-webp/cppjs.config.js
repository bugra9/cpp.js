export default {
    general: {
        name: 'webp',
    },
    export: {
        type: 'cmake',
        libName: ['webp', 'sharpyuv'],
    },
    paths: {
        config: import.meta.url,
        output: 'dist',
    },
};
