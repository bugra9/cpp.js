import mergeConfig from '@cpp.js/package-openssl/mergeConfig.mjs';

export default mergeConfig({
    paths: { config: import.meta.url },
});
