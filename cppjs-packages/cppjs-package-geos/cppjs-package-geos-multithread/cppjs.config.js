import geosWasmMultithread from '@cpp.js/package-geos-wasm-multithread/cppjs.config.js';
import geosAndroidMultithread from '@cpp.js/package-geos-android-multithread/cppjs.config.js';
import geosIosMultithread from '@cpp.js/package-geos-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        geosWasmMultithread,
        geosAndroidMultithread,
        geosIosMultithread,
    ],
  paths: {
    config: import.meta.url
  }
};
