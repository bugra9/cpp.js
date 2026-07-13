import mergeConfig from '@cpp.js/package-lerc/mergeConfig.mjs';

export default mergeConfig({
    paths: { config: import.meta.url },
});
