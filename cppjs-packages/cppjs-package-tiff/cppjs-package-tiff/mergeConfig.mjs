export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'tiff',
        alias: { package: '@cpp.js/package-tiff' },
    },
    export: {
        type: 'cmake',
        bundle: false,
        libName: ['tiff', 'tiffxx'],
        ...(newConfig.export || {}),
    },
    paths: {
        output: 'dist',
        base: '../..',
        ...(newConfig.paths || {}),
    },
});
