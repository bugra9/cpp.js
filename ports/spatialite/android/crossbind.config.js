import mergeConfig from '@crossbind/port-spatialite/mergeConfig.mjs';
import geosAndroid from '@crossbind/port-geos-android/crossbind.config.js';
import projAndroid from '@crossbind/port-proj-android/crossbind.config.js';
import sqlite3Android from '@crossbind/port-sqlite3-android/crossbind.config.js';
import zlibAndroid from '@crossbind/port-zlib-android/crossbind.config.js';
import iconvAndroid from '@crossbind/port-iconv-android/crossbind.config.js';

export default mergeConfig({
    dependencies: [geosAndroid, projAndroid, sqlite3Android, zlibAndroid, iconvAndroid],
    paths: { config: import.meta.url },
});
