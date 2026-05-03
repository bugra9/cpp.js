import jpegturboWasm from '@cpp.js/package-jpegturbo-wasm/cppjs.config.js';
import jpegturboAndroid from '@cpp.js/package-jpegturbo-android/cppjs.config.js';
import jpegturboIos from '@cpp.js/package-jpegturbo-ios/cppjs.config.js';

export default {
  dependencies: [
    jpegturboWasm,
    jpegturboAndroid,
    jpegturboIos
  ],
  paths: {
    config: import.meta.url
  }
};
