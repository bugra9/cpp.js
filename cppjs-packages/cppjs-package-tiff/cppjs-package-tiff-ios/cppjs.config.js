import zlibIos from '@cpp.js/package-zlib-ios/cppjs.config.js';

export default {
  dependencies: [
    zlibIos,
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
