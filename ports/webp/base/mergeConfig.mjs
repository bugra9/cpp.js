export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'webp',
        alias: { package: '@crossbind/port-webp' },
    },
    export: {
        type: 'cmake',
        bundle: false,
        libName: ['webp', 'sharpyuv'],
        ...(newConfig.export || {}),
    },
    paths: {
        output: 'dist',
        base: '../..',
        ...(newConfig.paths || {}),
    },
});
