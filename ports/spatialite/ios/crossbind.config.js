import mergeConfig from '@crossbind/port-spatialite/mergeConfig.mjs';
import geosIos from '@crossbind/port-geos-ios/crossbind.config.js';
import projIos from '@crossbind/port-proj-ios/crossbind.config.js';
import sqlite3Ios from '@crossbind/port-sqlite3-ios/crossbind.config.js';
import zlibIos from '@crossbind/port-zlib-ios/crossbind.config.js';
import iconvIos from '@crossbind/port-iconv-ios/crossbind.config.js';

export default mergeConfig({
    dependencies: [geosIos, projIos, sqlite3Ios, zlibIos, iconvIos],
    paths: { config: import.meta.url },
});
