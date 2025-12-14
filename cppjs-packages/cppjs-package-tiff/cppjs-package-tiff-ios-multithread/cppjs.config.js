import zlibIosMultithread from '@cpp.js/package-zlib-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        zlibIosMultithread,
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
