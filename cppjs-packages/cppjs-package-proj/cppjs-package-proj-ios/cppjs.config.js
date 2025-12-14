import tiffIos from '@cpp.js/package-tiff-ios/cppjs.config.js';
import sqlite3Ios from '@cpp.js/package-sqlite3-ios/cppjs.config.js';

export default {
  dependencies: [
    tiffIos,
    sqlite3Ios,
  ],
  general: {
    name: 'proj'
  },
  export: {
    type: 'cmake'
  },
  paths: {
    config: import.meta.url,
    base: '../..',
    output: 'dist'
  },
  platform: {
    'iOS-iphoneos': {
      'data': {
        'share/proj': 'proj'
      },
      env: {
        PROJ_LIB: '_CPPJS_DATA_PATH_/proj'
      }
    }
  }
};
