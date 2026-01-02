import projWasmMultithread from '@cpp.js/package-proj-wasm-multithread/cppjs.config.js';
import tiffWasmMultithread from '@cpp.js/package-tiff-wasm-multithread/cppjs.config.js';
import zlibWasmMultithread from '@cpp.js/package-zlib-wasm-multithread/cppjs.config.js';

export default {
  dependencies: [
    projWasmMultithread,
    tiffWasmMultithread,
    zlibWasmMultithread,
  ],
  general: {
    name: 'geotiff'
  },
  export: {
    type: 'cmake'
  },
  paths: {
    config: import.meta.url,
    base: '../..',
    output: 'dist'
  },

};
