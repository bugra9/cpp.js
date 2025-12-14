import zlibWasmMultithread from '@cpp.js/package-zlib-wasm-multithread/cppjs.config.js';
import zlibAndroidMultithread from '@cpp.js/package-zlib-android-multithread/cppjs.config.js';
import zlibIOSMultithread from '@cpp.js/package-zlib-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        zlibWasmMultithread,
        zlibAndroidMultithread,
        zlibIOSMultithread
    ],
    paths: {
        config: import.meta.url,
    },
};
