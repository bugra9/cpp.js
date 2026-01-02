import projAndroidMultithread from '@cpp.js/package-proj-android-multithread/cppjs.config.js';
import tiffAndroidMultithread from '@cpp.js/package-tiff-android-multithread/cppjs.config.js';
import zlibAndroidMultithread from '@cpp.js/package-zlib-android-multithread/cppjs.config.js';

export default {
  dependencies: [
    projAndroidMultithread,
    tiffAndroidMultithread,
    zlibAndroidMultithread,
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
  },

};
