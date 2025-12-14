import tiffIosMultithread from '@cpp.js/package-tiff-ios-multithread/cppjs.config.js';
import sqlite3IosMultithread from '@cpp.js/package-sqlite3-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        tiffIosMultithread,
        sqlite3IosMultithread,
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
  build: {
    usePthread: true
  },
  platform: {
    'iOS-iphoneos': {
      data: {
        'share/proj': 'proj'
      },
      env: {
        PROJ_LIB: '_CPPJS_DATA_PATH_/proj'
      }
    }
  }
};
