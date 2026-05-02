import geotiffWasm from '@cpp.js/package-geotiff-wasm/cppjs.config.js';
import geotiffAndroid from '@cpp.js/package-geotiff-android/cppjs.config.js';
import geotiffIos from '@cpp.js/package-geotiff-ios/cppjs.config.js';

export default {
  dependencies: [
    geotiffWasm,
    geotiffAndroid,
    geotiffIos,
  ],
  paths: {
    config: import.meta.url
  }
};
