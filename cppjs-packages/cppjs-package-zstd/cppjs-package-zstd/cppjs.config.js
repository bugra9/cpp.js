import zstdWasm from '@cpp.js/package-zstd-wasm/cppjs.config.js';
import zstdAndroid from '@cpp.js/package-zstd-android/cppjs.config.js';
import zstdIos from '@cpp.js/package-zstd-ios/cppjs.config.js';

export default {
  dependencies: [
    zstdWasm,
    zstdAndroid,
    zstdIos
  ],
  paths: {
    config: import.meta.url
  }
};
