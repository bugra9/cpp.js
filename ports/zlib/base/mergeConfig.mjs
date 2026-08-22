export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'z',
        alias: { package: '@crossbind/port-zlib' },
    },
    export: {
        type: 'cmake',
        bundle: false,
        ...(newConfig.export || {}),
    },
    paths: {
        output: 'dist',
        ...(newConfig.paths || {}),
    },
});
