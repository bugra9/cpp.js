import expatWasm from '@cpp.js/package-expat-wasm/cppjs.config.js';
import geosWasm from '@cpp.js/package-geos-wasm/cppjs.config.js';
import geotiffWasm from '@cpp.js/package-geotiff-wasm/cppjs.config.js';
import iconvWasm from '@cpp.js/package-iconv-wasm/cppjs.config.js';
import projWasm from '@cpp.js/package-proj-wasm/cppjs.config.js';
import spatialiteWasm from '@cpp.js/package-spatialite-wasm/cppjs.config.js';
import sqlite3Wasm from '@cpp.js/package-sqlite3-wasm/cppjs.config.js';
import tiffWasm from '@cpp.js/package-tiff-wasm/cppjs.config.js';
import webpWasm from '@cpp.js/package-webp-wasm/cppjs.config.js';
import zlibWasm from '@cpp.js/package-zlib-wasm/cppjs.config.js';

export default {
  dependencies: [
    expatWasm,
    geosWasm,
    geotiffWasm,
    iconvWasm,
    projWasm,
    spatialiteWasm,
    sqlite3Wasm,
    tiffWasm,
    webpWasm,
    zlibWasm,
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
