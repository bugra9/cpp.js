import tiffAndroid from '@cpp.js/package-tiff-android/cppjs.config.js';
import sqlite3Android from '@cpp.js/package-sqlite3-android/cppjs.config.js';

export default {
  dependencies: [
    tiffAndroid,
    sqlite3Android,
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
  targetSpecs: [
    {
      platform: 'android',
      specs: {
        data: {
          'share/proj': 'proj'
        },
        env: {
          PROJ_DATA: '_CPPJS_DATA_PATH_/proj'
        }
      }
    }
  ],
};
