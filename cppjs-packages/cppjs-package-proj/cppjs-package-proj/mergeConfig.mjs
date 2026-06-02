export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'proj',
        alias: { package: '@cpp.js/package-proj' },
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
        {
            specs: {
                data: { 'share/proj': 'proj' },
                env: { PROJ_DATA: '_CPPJS_DATA_PATH_/proj' },
            },
        },
        ...(newConfig.targetSpecs || []),
    ],
});
