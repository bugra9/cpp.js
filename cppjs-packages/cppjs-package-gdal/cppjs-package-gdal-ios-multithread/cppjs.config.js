import expatIosMultithread from '@cpp.js/package-expat-ios-multithread/cppjs.config.js';
import geosIosMultithread from '@cpp.js/package-geos-ios-multithread/cppjs.config.js';
import geotiffIosMultithread from '@cpp.js/package-geotiff-ios-multithread/cppjs.config.js';
import iconvIosMultithread from '@cpp.js/package-iconv-ios-multithread/cppjs.config.js';
import projIosMultithread from '@cpp.js/package-proj-ios-multithread/cppjs.config.js';
import spatialiteIosMultithread from '@cpp.js/package-spatialite-ios-multithread/cppjs.config.js';
import sqlite3IosMultithread from '@cpp.js/package-sqlite3-ios-multithread/cppjs.config.js';
import tiffIosMultithread from '@cpp.js/package-tiff-ios-multithread/cppjs.config.js';
import webpIosMultithread from '@cpp.js/package-webp-ios-multithread/cppjs.config.js';
import zlibIosMultithread from '@cpp.js/package-zlib-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        expatIosMultithread,
        geosIosMultithread,
        geotiffIosMultithread,
        iconvIosMultithread,
        projIosMultithread,
        spatialiteIosMultithread,
        sqlite3IosMultithread,
        tiffIosMultithread,
        webpIosMultithread,
        zlibIosMultithread,
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
  build: {
    usePthread: true
  },
  platform: {
    'iOS-iphoneos': {
      data: {
        'share/gdal': 'gdal'
      },
      env: {
        GDAL_DATA: '_CPPJS_DATA_PATH_/gdal',
        DXF_FEATURE_LIMIT_PER_BLOCK: '-1',
        GDAL_ENABLE_DEPRECATED_DRIVER_GTM: 'YES',
        CPL_LOG_ERRORS: 'ON'
      }
    }
  }
};
