export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'proj',
        alias: { package: '@crossbind/port-proj' },
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
                env: { PROJ_DATA: '_CROSSBIND_DATA_PATH_/proj' },
            },
        },
        ...(newConfig.targetSpecs || []),
    ],
});
