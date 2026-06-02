export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'sqlite3',
        alias: { package: '@cpp.js/package-sqlite3' },
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
