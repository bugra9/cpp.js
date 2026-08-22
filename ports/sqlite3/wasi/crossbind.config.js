import mergeConfig from '@crossbind/port-sqlite3/mergeConfig.mjs';

export default mergeConfig({
    paths: { config: import.meta.url },
});
