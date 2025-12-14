import iconvWasmMultithread from '@cpp.js/package-iconv-wasm-multithread/cppjs.config.js';
import iconvAndroidMultithread from '@cpp.js/package-iconv-android-multithread/cppjs.config.js';
import iconvIosMultithread from '@cpp.js/package-iconv-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        iconvWasmMultithread,
        iconvAndroidMultithread,
        iconvIosMultithread,
    ],
  paths: {
    config: import.meta.url
  }
};
