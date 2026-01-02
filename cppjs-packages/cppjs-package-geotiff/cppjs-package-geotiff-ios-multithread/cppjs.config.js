import projIosMultithread from '@cpp.js/package-proj-ios-multithread/cppjs.config.js';
import tiffIosMultithread from '@cpp.js/package-tiff-ios-multithread/cppjs.config.js';
import zlibIosMultithread from '@cpp.js/package-zlib-ios-multithread/cppjs.config.js';

export default {
  dependencies: [
    projIosMultithread,
    tiffIosMultithread,
    zlibIosMultithread,
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
