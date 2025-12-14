import gdalWasmMultithread from '@cpp.js/package-gdal-wasm-multithread/cppjs.config.js';
import gdalAndroidMultithread from '@cpp.js/package-gdal-android-multithread/cppjs.config.js';
import gdalIosMultithread from '@cpp.js/package-gdal-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        gdalWasmMultithread,
        gdalAndroidMultithread,
        gdalIosMultithread,
    ],
  paths: {
    config: import.meta.url
  }
};
