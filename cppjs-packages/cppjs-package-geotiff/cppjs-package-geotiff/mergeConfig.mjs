export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'geotiff',
        alias: { package: '@cpp.js/package-geotiff' },
    },
    export: {
        type: 'cmake',
        bundle: false,
        ...(newConfig.export || {}),
    },
    paths: {
        output: 'dist',
        base: '../..',
        ...(newConfig.paths || {}),
    },
});
