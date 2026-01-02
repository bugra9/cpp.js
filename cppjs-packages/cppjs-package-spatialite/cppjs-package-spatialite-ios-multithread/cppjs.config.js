import geosIosMultithread from '@cpp.js/package-geos-ios-multithread/cppjs.config.js';
import projIosMultithread from '@cpp.js/package-proj-ios-multithread/cppjs.config.js';
import sqlite3IosMultithread from '@cpp.js/package-sqlite3-ios-multithread/cppjs.config.js';
import zlibIosMultithread from '@cpp.js/package-zlib-ios-multithread/cppjs.config.js';
import iconvIosMultithread from '@cpp.js/package-iconv-ios-multithread/cppjs.config.js';

export default {
  dependencies: [
    geosIosMultithread,
    projIosMultithread,
    sqlite3IosMultithread,
    zlibIosMultithread,
    iconvIosMultithread,
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
