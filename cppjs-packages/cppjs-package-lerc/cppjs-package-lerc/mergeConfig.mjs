export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'Lerc',
        alias: { package: '@cpp.js/package-lerc' },
    },
    export: {
        type: 'cmake',
        bundle: false,
        libName: ['Lerc'],
        ...(newConfig.export || {}),
    },
    paths: {
        output: 'dist',
        base: '../..',
        ...(newConfig.paths || {}),
    },
});
