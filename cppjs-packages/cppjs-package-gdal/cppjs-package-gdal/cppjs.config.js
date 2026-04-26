import gdalWasm from '@cpp.js/package-gdal-wasm/cppjs.config.js';
import gdalAndroid from '@cpp.js/package-gdal-android/cppjs.config.js';
import gdalIos from '@cpp.js/package-gdal-ios/cppjs.config.js';

export default {
  dependencies: [
    gdalWasm,
    gdalAndroid,
    gdalIos,
  ],
  paths: {
    config: import.meta.url
  }
};
