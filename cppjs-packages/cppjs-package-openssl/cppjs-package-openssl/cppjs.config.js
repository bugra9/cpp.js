import opensslWasm from '@cpp.js/package-openssl-wasm/cppjs.config.js';
import opensslAndroid from '@cpp.js/package-openssl-android/cppjs.config.js';
import opensslIos from '@cpp.js/package-openssl-ios/cppjs.config.js';

export default {
  dependencies: [
    opensslWasm,
    opensslAndroid,
    opensslIos,
  ],
  paths: {
    config: import.meta.url
  }
};
