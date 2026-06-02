export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'jpeg',
        alias: { package: '@cpp.js/package-jpegturbo' },
    },
    export: {
        type: 'cmake',
        bundle: false,
        libName: ['jpeg'],
        ...(newConfig.export || {}),
    },
    paths: {
        output: 'dist',
        base: '../..',
        ...(newConfig.paths || {}),
    },
});
