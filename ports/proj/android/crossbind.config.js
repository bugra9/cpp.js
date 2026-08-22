import mergeConfig from '@crossbind/port-proj/mergeConfig.mjs';
import tiffAndroid from '@crossbind/port-tiff-android/crossbind.config.js';
import sqlite3Android from '@crossbind/port-sqlite3-android/crossbind.config.js';

export default mergeConfig({
    dependencies: [tiffAndroid, sqlite3Android],
    paths: { config: import.meta.url },
});
