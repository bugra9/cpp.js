export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'zstd',
        alias: { package: '@cpp.js/package-zstd' },
    },
    export: {
        type: 'cmake',
        bundle: false,
        libName: ['zstd'],
        ...(newConfig.export || {}),
    },
    paths: {
        output: 'dist',
        base: '../..',
        ...(newConfig.paths || {}),
    },
});
