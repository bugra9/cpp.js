import spatialiteWasm from '@cpp.js/package-spatialite-wasm/cppjs.config.js';
import spatialiteAndroid from '@cpp.js/package-spatialite-android/cppjs.config.js';
import spatialiteIos from '@cpp.js/package-spatialite-ios/cppjs.config.js';

export default {
    dependencies: [
        spatialiteWasm,
        spatialiteAndroid,
        spatialiteIos,
    ],
    paths: {
        config: import.meta.url
    }
};
