import projWasm from '@cpp.js/package-proj-wasm/cppjs.config.js';
import projAndroid from '@cpp.js/package-proj-android/cppjs.config.js';
import projIos from '@cpp.js/package-proj-ios/cppjs.config.js';

export default {
  dependencies: [
    projWasm,
    projAndroid,
    projIos,
  ],
  paths: {
    config: import.meta.url
  }
};
