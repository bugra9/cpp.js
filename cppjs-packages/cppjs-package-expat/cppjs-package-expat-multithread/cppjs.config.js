import expatWasmMultithread from '@cpp.js/package-expat-wasm-multithread/cppjs.config.js';
import expatAndroidMultithread from '@cpp.js/package-expat-android-multithread/cppjs.config.js';
import expatIosMultithread from '@cpp.js/package-expat-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        expatWasmMultithread,
        expatAndroidMultithread,
        expatIosMultithread,
    ],
  paths: {
    config: import.meta.url
  }
};
