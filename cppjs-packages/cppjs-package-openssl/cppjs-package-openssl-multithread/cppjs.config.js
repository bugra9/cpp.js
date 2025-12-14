import opensslWasmMultithread from '@cpp.js/package-openssl-wasm-multithread/cppjs.config.js';
import opensslAndroidMultithread from '@cpp.js/package-openssl-android-multithread/cppjs.config.js';
import opensslIosMultithread from '@cpp.js/package-openssl-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        opensslWasmMultithread,
        opensslAndroidMultithread,
        opensslIosMultithread,
    ],
  paths: {
    config: import.meta.url
  }
};
