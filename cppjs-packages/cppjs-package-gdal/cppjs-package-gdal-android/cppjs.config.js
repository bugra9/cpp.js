import expatAndroid from '@cpp.js/package-expat-android/cppjs.config.js';
import geosAndroid from '@cpp.js/package-geos-android/cppjs.config.js';
import geotiffAndroid from '@cpp.js/package-geotiff-android/cppjs.config.js';
import iconvAndroid from '@cpp.js/package-iconv-android/cppjs.config.js';
import projAndroid from '@cpp.js/package-proj-android/cppjs.config.js';
import spatialiteAndroid from '@cpp.js/package-spatialite-android/cppjs.config.js';
import sqlite3Android from '@cpp.js/package-sqlite3-android/cppjs.config.js';
import tiffAndroid from '@cpp.js/package-tiff-android/cppjs.config.js';
import webpAndroid from '@cpp.js/package-webp-android/cppjs.config.js';
import zlibAndroid from '@cpp.js/package-zlib-android/cppjs.config.js';

export default {
  dependencies: [
    expatAndroid,
    geosAndroid,
    geotiffAndroid,
    iconvAndroid,
    projAndroid,
    spatialiteAndroid,
    sqlite3Android,
    tiffAndroid,
    webpAndroid,
    zlibAndroid,
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
