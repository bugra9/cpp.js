import zlibAndroid from '@cpp.js/package-zlib-android/cppjs.config.js';
import jpegturboAndroid from '@cpp.js/package-jpegturbo-android/cppjs.config.js';
import zstdAndroid from '@cpp.js/package-zstd-android/cppjs.config.js';
import lercAndroid from '@cpp.js/package-lerc-android/cppjs.config.js';

export default {
  dependencies: [
    zlibAndroid,
    jpegturboAndroid,
    zstdAndroid,
    lercAndroid,
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
