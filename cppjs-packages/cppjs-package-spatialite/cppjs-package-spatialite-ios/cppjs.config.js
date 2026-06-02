import mergeConfig from '@cpp.js/package-spatialite/mergeConfig.mjs';
import geosIos from '@cpp.js/package-geos-ios/cppjs.config.js';
import projIos from '@cpp.js/package-proj-ios/cppjs.config.js';
import sqlite3Ios from '@cpp.js/package-sqlite3-ios/cppjs.config.js';
import zlibIos from '@cpp.js/package-zlib-ios/cppjs.config.js';
import iconvIos from '@cpp.js/package-iconv-ios/cppjs.config.js';

export default mergeConfig({
    dependencies: [geosIos, projIos, sqlite3Ios, zlibIos, iconvIos],
    paths: { config: import.meta.url },
});
