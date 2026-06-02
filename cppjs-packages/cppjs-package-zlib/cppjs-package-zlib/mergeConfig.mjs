export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'z',
        alias: { package: '@cpp.js/package-zlib' },
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
