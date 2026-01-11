import expatIos from '@cpp.js/package-expat-ios/cppjs.config.js';
import geosIos from '@cpp.js/package-geos-ios/cppjs.config.js';
import geotiffIos from '@cpp.js/package-geotiff-ios/cppjs.config.js';
import iconvIos from '@cpp.js/package-iconv-ios/cppjs.config.js';
import projIos from '@cpp.js/package-proj-ios/cppjs.config.js';
import spatialiteIos from '@cpp.js/package-spatialite-ios/cppjs.config.js';
import sqlite3Ios from '@cpp.js/package-sqlite3-ios/cppjs.config.js';
import tiffIos from '@cpp.js/package-tiff-ios/cppjs.config.js';
import webpIos from '@cpp.js/package-webp-ios/cppjs.config.js';
import zlibIos from '@cpp.js/package-zlib-ios/cppjs.config.js';

export default {
  dependencies: [
    expatIos,
    geosIos,
    geotiffIos,
    iconvIos,
    projIos,
    spatialiteIos,
    sqlite3Ios,
    tiffIos,
    webpIos,
    zlibIos,
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
