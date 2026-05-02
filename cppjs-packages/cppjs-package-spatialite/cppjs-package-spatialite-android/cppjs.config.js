import geosAndroid from '@cpp.js/package-geos-android/cppjs.config.js';
import projAndroid from '@cpp.js/package-proj-android/cppjs.config.js';
import sqlite3Android from '@cpp.js/package-sqlite3-android/cppjs.config.js';
import zlibAndroid from '@cpp.js/package-zlib-android/cppjs.config.js';
import iconvAndroid from '@cpp.js/package-iconv-android/cppjs.config.js';

export default {
  dependencies: [
    geosAndroid,
    projAndroid,
    sqlite3Android,
    zlibAndroid,
    iconvAndroid,
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
