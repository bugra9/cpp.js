import zlibAndroidMultithread from '@cpp.js/package-zlib-android-multithread/cppjs.config.js';

export default {
    dependencies: [
        zlibAndroidMultithread,
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
