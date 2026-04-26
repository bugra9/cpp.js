import tiffWasm from '@cpp.js/package-tiff-wasm/cppjs.config.js';
import tiffAndroid from '@cpp.js/package-tiff-android/cppjs.config.js';
import tiffIos from '@cpp.js/package-tiff-ios/cppjs.config.js';

export default {
  dependencies: [
    tiffWasm,
    tiffAndroid,
    tiffIos,
  ],
  paths: {
    config: import.meta.url
  }
};
