import geosWasmMultithread from '@cpp.js/package-geos-wasm-multithread/cppjs.config.js';
import projWasmMultithread from '@cpp.js/package-proj-wasm-multithread/cppjs.config.js';
import sqlite3WasmMultithread from '@cpp.js/package-sqlite3-wasm-multithread/cppjs.config.js';
import zlibWasmMultithread from '@cpp.js/package-zlib-wasm-multithread/cppjs.config.js';
import iconvWasmMultithread from '@cpp.js/package-iconv-wasm-multithread/cppjs.config.js';

export default {
    dependencies: [
        geosWasmMultithread,
        projWasmMultithread,
        sqlite3WasmMultithread,
        zlibWasmMultithread,
        iconvWasmMultithread,
    ],
  general: {
    name: 'spatialite'
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
  }
};
