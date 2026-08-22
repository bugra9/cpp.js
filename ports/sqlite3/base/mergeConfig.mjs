export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'sqlite3',
        alias: { package: '@crossbind/port-sqlite3' },
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
