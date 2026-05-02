import iconvWasm from '@cpp.js/package-iconv-wasm/cppjs.config.js';
import iconvAndroid from '@cpp.js/package-iconv-android/cppjs.config.js';
import iconvIos from '@cpp.js/package-iconv-ios/cppjs.config.js';

export default {
  dependencies: [
    iconvWasm,
    iconvAndroid,
    iconvIos,
  ],
  paths: {
    config: import.meta.url
  }
};
