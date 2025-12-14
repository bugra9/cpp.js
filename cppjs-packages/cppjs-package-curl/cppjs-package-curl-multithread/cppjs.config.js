import curlWasmMultithread from '@cpp.js/package-curl-wasm-multithread/cppjs.config.js';
import curlAndroidMultithread from '@cpp.js/package-curl-android-multithread/cppjs.config.js';
import curlIosMultithread from '@cpp.js/package-curl-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        curlWasmMultithread,
        curlAndroidMultithread,
        curlIosMultithread,
    ],
  paths: {
    config: import.meta.url
  }
};
