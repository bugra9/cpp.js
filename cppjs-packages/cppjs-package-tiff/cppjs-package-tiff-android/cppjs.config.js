import zlibAndroid from '@cpp.js/package-zlib-android/cppjs.config.js';

export default {
  dependencies: [
    zlibAndroid,
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
