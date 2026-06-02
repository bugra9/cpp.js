export default (newConfig = {}) => ({
    ...newConfig,
    general: {
        name: 'openssl',
        alias: { package: '@cpp.js/package-openssl' },
    },
    export: {
        type: 'cmake',
        bundle: false,
        libName: ['ssl', 'crypto'],
        ...(newConfig.export || {}),
    },
    paths: {
        output: 'dist',
        base: '../..',
        ...(newConfig.paths || {}),
    },
    targetSpecs: [
        { platform: 'android', specs: { libType: 'static', data: { 'ssl/certs': 'certs' } } },
        { platform: 'ios', specs: { data: { 'ssl/certs': 'certs' } } },
        ...(newConfig.targetSpecs || []),
    ],
});
