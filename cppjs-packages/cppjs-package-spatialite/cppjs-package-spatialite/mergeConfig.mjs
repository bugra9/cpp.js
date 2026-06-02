export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'spatialite',
        alias: { package: '@cpp.js/package-spatialite' },
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
