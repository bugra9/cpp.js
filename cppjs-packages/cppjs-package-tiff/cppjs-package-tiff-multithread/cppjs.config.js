import tiffWasmMultithread from '@cpp.js/package-tiff-wasm-multithread/cppjs.config.js';
import tiffAndroidMultithread from '@cpp.js/package-tiff-android-multithread/cppjs.config.js';
import tiffIosMultithread from '@cpp.js/package-tiff-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        tiffWasmMultithread,
        tiffAndroidMultithread,
        tiffIosMultithread,
    ],
  paths: {
    config: import.meta.url
  }
};
