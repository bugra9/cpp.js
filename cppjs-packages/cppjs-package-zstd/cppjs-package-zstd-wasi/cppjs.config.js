import mergeConfig from '@cpp.js/package-zstd/mergeConfig.mjs';

export default mergeConfig({
    paths: { config: import.meta.url },
});
