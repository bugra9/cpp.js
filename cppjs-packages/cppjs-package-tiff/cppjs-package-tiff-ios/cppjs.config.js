import zlibIos from '@cpp.js/package-zlib-ios/cppjs.config.js';
import jpegturboIos from '@cpp.js/package-jpegturbo-ios/cppjs.config.js';
import zstdIos from '@cpp.js/package-zstd-ios/cppjs.config.js';
import lercIos from '@cpp.js/package-lerc-ios/cppjs.config.js';

export default {
  dependencies: [
    zlibIos,
    jpegturboIos,
    zstdIos,
    lercIos,
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
