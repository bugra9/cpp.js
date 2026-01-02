import tiffWasm from '@cpp.js/package-tiff-wasm/cppjs.config.js';
import sqlite3Wasm from '@cpp.js/package-sqlite3-wasm/cppjs.config.js';

export default {
  dependencies: [
    tiffWasm,
    sqlite3Wasm,
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
