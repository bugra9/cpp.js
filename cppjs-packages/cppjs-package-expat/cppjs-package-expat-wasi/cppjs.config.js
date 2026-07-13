import mergeConfig from '@cpp.js/package-expat/mergeConfig.mjs';

export default mergeConfig({
    paths: { config: import.meta.url },
});
