import expatWasmMultithread from '@cpp.js/package-expat-wasm-multithread/cppjs.config.js';
import geosWasmMultithread from '@cpp.js/package-geos-wasm-multithread/cppjs.config.js';
import geotiffWasmMultithread from '@cpp.js/package-geotiff-wasm-multithread/cppjs.config.js';
import iconvWasmMultithread from '@cpp.js/package-iconv-wasm-multithread/cppjs.config.js';
import projWasmMultithread from '@cpp.js/package-proj-wasm-multithread/cppjs.config.js';
import spatialiteWasmMultithread from '@cpp.js/package-spatialite-wasm-multithread/cppjs.config.js';
import sqlite3WasmMultithread from '@cpp.js/package-sqlite3-wasm-multithread/cppjs.config.js';
import tiffWasmMultithread from '@cpp.js/package-tiff-wasm-multithread/cppjs.config.js';
import webpWasmMultithread from '@cpp.js/package-webp-wasm-multithread/cppjs.config.js';
import zlibWasmMultithread from '@cpp.js/package-zlib-wasm-multithread/cppjs.config.js';

export default {
  dependencies: [
    expatWasmMultithread,
    geosWasmMultithread,
    geotiffWasmMultithread,
    iconvWasmMultithread,
    projWasmMultithread,
    spatialiteWasmMultithread,
    sqlite3WasmMultithread,
    tiffWasmMultithread,
    webpWasmMultithread,
    zlibWasmMultithread,
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
