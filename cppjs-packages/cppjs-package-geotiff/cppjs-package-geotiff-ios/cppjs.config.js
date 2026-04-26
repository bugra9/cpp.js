import projIos from '@cpp.js/package-proj-ios/cppjs.config.js';
import tiffIos from '@cpp.js/package-tiff-ios/cppjs.config.js';
import zlibIos from '@cpp.js/package-zlib-ios/cppjs.config.js';

export default {
  dependencies: [
    projIos,
    tiffIos,
    zlibIos,
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
