import expatWasm from '@cpp.js/package-expat-wasm/cppjs.config.js';
import expatAndroid from '@cpp.js/package-expat-android/cppjs.config.js';
import expatIos from '@cpp.js/package-expat-ios/cppjs.config.js';

export default {
  dependencies: [
    expatWasm,
    expatAndroid,
    expatIos,
  ],
  paths: {
    config: import.meta.url
  }
};
