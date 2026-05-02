import zlibWasm from '@cpp.js/package-zlib-wasm/cppjs.config.js';
import jpegturboWasm from '@cpp.js/package-jpegturbo-wasm/cppjs.config.js';

export default {
  dependencies: [
    zlibWasm,
    jpegturboWasm,
  ],
  general: {
    name: 'tiff'
  },
  export: {
    type: 'cmake',
    libName: [
      'tiff',
      'tiffxx'
    ]
  },
  paths: {
    config: import.meta.url,
    base: '../..',
    output: 'dist'
  }
};
