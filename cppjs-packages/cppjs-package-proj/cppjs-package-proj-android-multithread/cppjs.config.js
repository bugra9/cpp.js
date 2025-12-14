import tiffAndroidMultithread from '@cpp.js/package-tiff-android-multithread/cppjs.config.js';
import sqlite3AndroidMultithread from '@cpp.js/package-sqlite3-android-multithread/cppjs.config.js';

export default {
    dependencies: [
        tiffAndroidMultithread,
        sqlite3AndroidMultithread,
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
    'Android-arm64-v8a': {
      data: {
        'share/proj': 'proj'
      },
      env: {
        PROJ_LIB: '_CPPJS_DATA_PATH_/proj'
      }
    }
  }
};
