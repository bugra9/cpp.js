import webpWasm from '@cpp.js/package-webp-wasm/cppjs.config.js';
import webpAndroid from '@cpp.js/package-webp-android/cppjs.config.js';
import webpIos from '@cpp.js/package-webp-ios/cppjs.config.js';

export default {
  dependencies: [
    webpWasm,
    webpAndroid,
    webpIos,
  ],
  paths: {
    config: import.meta.url
  }
};
