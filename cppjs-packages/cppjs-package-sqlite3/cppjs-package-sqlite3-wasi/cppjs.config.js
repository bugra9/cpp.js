import mergeConfig from '@cpp.js/package-sqlite3/mergeConfig.mjs';

export default mergeConfig({
    paths: { config: import.meta.url },
});
