import webpWasmMultithread from '@cpp.js/package-webp-wasm-multithread/cppjs.config.js';
import webpAndroidMultithread from '@cpp.js/package-webp-android-multithread/cppjs.config.js';
import webpIosMultithread from '@cpp.js/package-webp-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        webpWasmMultithread,
        webpAndroidMultithread,
        webpIosMultithread,
    ],
  paths: {
    config: import.meta.url
  }
};
