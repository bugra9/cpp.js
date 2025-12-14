import spatialiteWasmMultithread from '@cpp.js/package-spatialite-wasm-multithread/cppjs.config.js';
import spatialiteAndroidMultithread from '@cpp.js/package-spatialite-android-multithread/cppjs.config.js';
import spatialiteIosMultithread from '@cpp.js/package-spatialite-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        spatialiteWasmMultithread,
        spatialiteAndroidMultithread,
        spatialiteIosMultithread,
    ],
  paths: {
    config: import.meta.url
  }
};
