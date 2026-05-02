import curlWasm from '@cpp.js/package-curl-wasm/cppjs.config.js';
import curlAndroid from '@cpp.js/package-curl-android/cppjs.config.js';
import curlIos from '@cpp.js/package-curl-ios/cppjs.config.js';

export default {
  dependencies: [
    curlWasm,
    curlAndroid,
    curlIos,
  ],
  paths: {
    config: import.meta.url
  }
};
