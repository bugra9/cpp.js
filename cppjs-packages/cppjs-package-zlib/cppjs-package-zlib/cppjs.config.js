import zlibWasm from '@cpp.js/package-zlib-wasm/cppjs.config.js';
import zlibAndroid from '@cpp.js/package-zlib-android/cppjs.config.js';
import zlibIOS from '@cpp.js/package-zlib-ios/cppjs.config.js';

export default {
    dependencies: [
        zlibWasm,
        zlibAndroid,
        zlibIOS
    ],
    paths: {
        config: import.meta.url,
    },
};
