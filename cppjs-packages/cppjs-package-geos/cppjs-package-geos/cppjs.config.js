import geosWasm from '@cpp.js/package-geos-wasm/cppjs.config.js';
import geosAndroid from '@cpp.js/package-geos-android/cppjs.config.js';
import geosIos from '@cpp.js/package-geos-ios/cppjs.config.js';

export default {
  dependencies: [
    geosWasm,
    geosAndroid,
    geosIos,
  ],
  paths: {
    config: import.meta.url
  }
};
