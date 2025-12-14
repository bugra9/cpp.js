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
  build: {
    usePthread: true
  },
  platform: {
    'Emscripten-x86_64-browser': {
      data: {
        'share/proj': '/usr/share/proj'
      },
      env: {
        PROJ_LIB: '/usr/share/proj'
      }
    },
    'Emscripten-x86_64-node': {
      data: {
        'share/proj': 'proj'
      },
      env: {
        PROJ_LIB: '_CPPJS_DATA_PATH_/proj'
      }
    }
  }
};
