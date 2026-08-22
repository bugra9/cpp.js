export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'spatialite',
        alias: { package: '@crossbind/port-spatialite' },
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
