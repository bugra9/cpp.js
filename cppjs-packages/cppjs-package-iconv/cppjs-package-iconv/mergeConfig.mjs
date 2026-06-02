export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'iconv',
        alias: { package: '@cpp.js/package-iconv' },
    },
    export: {
        type: 'cmake',
        bundle: false,
        libName: ['iconv', 'charset'],
        ...(newConfig.export || {}),
    },
    paths: {
        output: 'dist',
        base: '../..',
        ...(newConfig.paths || {}),
    },
    targetSpecs: [
        { platform: 'wasm', specs: { ignoreLibName: ['charset'] } },
        ...(newConfig.targetSpecs || []),
    ],
});
