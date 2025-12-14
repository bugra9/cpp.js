import geotiffWasmMultithread from '@cpp.js/package-geotiff-wasm-multithread/cppjs.config.js';
import geotiffAndroidMultithread from '@cpp.js/package-geotiff-android-multithread/cppjs.config.js';
import geotiffIosMultithread from '@cpp.js/package-geotiff-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        geotiffWasmMultithread,
        geotiffAndroidMultithread,
        geotiffIosMultithread,
    ],
  paths: {
    config: import.meta.url
  }
};
