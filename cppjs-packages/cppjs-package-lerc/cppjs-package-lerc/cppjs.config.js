import lercWasm from '@cpp.js/package-lerc-wasm/cppjs.config.js';
import lercAndroid from '@cpp.js/package-lerc-android/cppjs.config.js';
import lercIos from '@cpp.js/package-lerc-ios/cppjs.config.js';

export default {
  dependencies: [
    lercWasm,
    lercAndroid,
    lercIos
  ],
  paths: {
    config: import.meta.url
  }
};
