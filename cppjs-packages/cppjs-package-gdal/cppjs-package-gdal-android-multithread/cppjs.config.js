import expatAndroidMultithread from '@cpp.js/package-expat-android-multithread/cppjs.config.js';
import geosAndroidMultithread from '@cpp.js/package-geos-android-multithread/cppjs.config.js';
import geotiffAndroidMultithread from '@cpp.js/package-geotiff-android-multithread/cppjs.config.js';
import iconvAndroidMultithread from '@cpp.js/package-iconv-android-multithread/cppjs.config.js';
import projAndroidMultithread from '@cpp.js/package-proj-android-multithread/cppjs.config.js';
import spatialiteAndroidMultithread from '@cpp.js/package-spatialite-android-multithread/cppjs.config.js';
import sqlite3AndroidMultithread from '@cpp.js/package-sqlite3-android-multithread/cppjs.config.js';
import tiffAndroidMultithread from '@cpp.js/package-tiff-android-multithread/cppjs.config.js';
import webpAndroidMultithread from '@cpp.js/package-webp-android-multithread/cppjs.config.js';
import zlibAndroidMultithread from '@cpp.js/package-zlib-android-multithread/cppjs.config.js';

export default {
  dependencies: [
    expatAndroidMultithread,
    geosAndroidMultithread,
    geotiffAndroidMultithread,
    iconvAndroidMultithread,
    projAndroidMultithread,
    spatialiteAndroidMultithread,
    sqlite3AndroidMultithread,
    tiffAndroidMultithread,
    webpAndroidMultithread,
    zlibAndroidMultithread,
  ],
  general: {
    name: 'gdal'
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
      specs: {
        'data': {
          'share/gdal': 'gdal'
        },
        env: {
          GDAL_DATA: '_CPPJS_DATA_PATH_/gdal',
          DXF_FEATURE_LIMIT_PER_BLOCK: '-1',
          GDAL_ENABLE_DEPRECATED_DRIVER_GTM: 'YES',
          CPL_LOG_ERRORS: 'ON',
          GDAL_NUM_THREADS: '0',
        }
      }
    }
  ],
};
