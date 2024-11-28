export default {
    general: {
        name: 'geos',
    },
    export: {
        type: 'cmake',
        libName: ['geos', 'geos_c'],
    },
    paths: {
        config: import.meta.url,
        base: '../..',
        output: 'dist',
    },
};
