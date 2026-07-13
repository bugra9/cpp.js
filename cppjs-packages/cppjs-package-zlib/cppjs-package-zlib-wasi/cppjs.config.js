import mergeConfig from '@cpp.js/package-zlib/mergeConfig.mjs';

export default mergeConfig({
    paths: { config: import.meta.url },
});
