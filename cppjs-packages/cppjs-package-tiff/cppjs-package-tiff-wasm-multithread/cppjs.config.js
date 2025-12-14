import zlibWasmMultithread from '@cpp.js/package-zlib-wasm-multithread/cppjs.config.js';

export default {
    dependencies: [
        zlibWasmMultithread,
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
  },
  build: {
    usePthread: true
  }
};
