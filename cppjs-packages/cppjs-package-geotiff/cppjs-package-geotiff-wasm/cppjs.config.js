import projWasm from '@cpp.js/package-proj-wasm/cppjs.config.js';
import tiffWasm from '@cpp.js/package-tiff-wasm/cppjs.config.js';
import zlibWasm from '@cpp.js/package-zlib-wasm/cppjs.config.js';

export default {
  dependencies: [
    projWasm,
    tiffWasm,
    zlibWasm,
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
  }
};
