import mergeConfig from '@cpp.js/package-openssl/mergeConfig.mjs';

export default mergeConfig({
    paths: { config: import.meta.url },
    // Ship the CA bundle as data, like android/ios.
    targetSpecs: [
        {
            platform: 'wasi',
            specs: {
                data: { 'ssl/certs': 'certs' },
                env: { CURL_CA_BUNDLE: '_CPPJS_DATA_PATH_/certs/cacert.pem' },
            },
        },
    ],
});
