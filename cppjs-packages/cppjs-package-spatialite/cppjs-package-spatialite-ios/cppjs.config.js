import geosIos from '@cpp.js/package-geos-ios/cppjs.config.js';
import projIos from '@cpp.js/package-proj-ios/cppjs.config.js';
import sqlite3Ios from '@cpp.js/package-sqlite3-ios/cppjs.config.js';
import zlibIos from '@cpp.js/package-zlib-ios/cppjs.config.js';
import iconvIos from '@cpp.js/package-iconv-ios/cppjs.config.js';

export default {
  dependencies: [
    geosIos,
    projIos,
    sqlite3Ios,
    zlibIos,
    iconvIos,
  ],
  general: {
    name: 'spatialite'
  },
  export: {
    type: 'cmake'
  },
  paths: {
    config: import.meta.url,
    base: '../..',
    output: 'dist'
  }
};
