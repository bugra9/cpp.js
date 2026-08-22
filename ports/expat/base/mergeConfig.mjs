export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'expat',
        alias: { package: '@crossbind/port-expat' },
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
