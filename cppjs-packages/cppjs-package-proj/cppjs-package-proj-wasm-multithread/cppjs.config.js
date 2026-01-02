import tiffWasmMultithread from '@cpp.js/package-tiff-wasm-multithread/cppjs.config.js';
import sqlite3WasmMultithread from '@cpp.js/package-sqlite3-wasm-multithread/cppjs.config.js';

export default {
  dependencies: [
    tiffWasmMultithread,
    sqlite3WasmMultithread,
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
      specs: {
        data: {
          'share/proj': 'proj'
        },
        env: {
          PROJ_LIB: '_CPPJS_DATA_PATH_/proj'
        }
      }
    }
  ],
};
