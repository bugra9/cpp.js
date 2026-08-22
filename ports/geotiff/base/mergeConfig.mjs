export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'geotiff',
        alias: { package: '@crossbind/port-geotiff' },
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
