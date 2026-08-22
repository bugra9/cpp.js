export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'curl',
        alias: { package: '@crossbind/port-curl' },
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
    targetSpecs: [
        { platform: 'wasm', specs: { binary: { emccFlags: ['-s', 'FETCH'] } } },
        ...(newConfig.targetSpecs || []),
    ],
});
