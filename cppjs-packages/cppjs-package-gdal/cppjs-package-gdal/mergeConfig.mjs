export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'gdal',
        alias: { package: '@cpp.js/package-gdal' },
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
                data: { 'share/gdal': 'gdal' },
                env: {
                    GDAL_DATA: '_CPPJS_DATA_PATH_/gdal',
                    DXF_FEATURE_LIMIT_PER_BLOCK: '-1',
                    GDAL_ENABLE_DEPRECATED_DRIVER_GTM: 'YES',
                    CPL_LOG_ERRORS: 'ON',
                },
            },
        },
        {
            platform: 'wasm',
            specs: {
                env: {
                    GDAL_NUM_THREADS: (state, target) => (target.runtime === 'st' ? '0' : '1'),
                },
            },
        },
        ...(newConfig.targetSpecs || []),
    ],
});
