import projWasmMultithread from '@cpp.js/package-proj-wasm-multithread/cppjs.config.js';
import projAndroidMultithread from '@cpp.js/package-proj-android-multithread/cppjs.config.js';
import projIosMultithread from '@cpp.js/package-proj-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        projWasmMultithread,
        projAndroidMultithread,
        projIosMultithread,
    ],
  paths: {
    config: import.meta.url
  }
};
