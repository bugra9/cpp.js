export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'geos',
        alias: { package: '@cpp.js/package-geos' },
    },
    export: {
        type: 'cmake',
        bundle: false,
        libName: ['geos', 'geos_c'],
        ...(newConfig.export || {}),
    },
    paths: {
        output: 'dist',
        base: '../..',
        ...(newConfig.paths || {}),
    },
});
