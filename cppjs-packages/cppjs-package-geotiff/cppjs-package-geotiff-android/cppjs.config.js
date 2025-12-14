import projAndroid from '@cpp.js/package-proj-android/cppjs.config.js';
import tiffAndroid from '@cpp.js/package-tiff-android/cppjs.config.js';
import zlibAndroid from '@cpp.js/package-zlib-android/cppjs.config.js';

export default {
  dependencies: [
    projAndroid,
    tiffAndroid,
    zlibAndroid,
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
