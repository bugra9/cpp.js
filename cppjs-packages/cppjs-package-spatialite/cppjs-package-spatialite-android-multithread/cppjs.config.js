import geosAndroidMultithread from '@cpp.js/package-geos-android-multithread/cppjs.config.js';
import projAndroidMultithread from '@cpp.js/package-proj-android-multithread/cppjs.config.js';
import sqlite3AndroidMultithread from '@cpp.js/package-sqlite3-android-multithread/cppjs.config.js';
import zlibAndroidMultithread from '@cpp.js/package-zlib-android-multithread/cppjs.config.js';
import iconvAndroidMultithread from '@cpp.js/package-iconv-android-multithread/cppjs.config.js';

export default {
  dependencies: [
    geosAndroidMultithread,
    projAndroidMultithread,
    sqlite3AndroidMultithread,
    zlibAndroidMultithread,
    iconvAndroidMultithread,
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
  },

};
