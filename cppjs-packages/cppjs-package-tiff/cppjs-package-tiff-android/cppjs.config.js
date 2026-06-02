import mergeConfig from '@cpp.js/package-tiff/mergeConfig.mjs';
import zlibAndroid from '@cpp.js/package-zlib-android/cppjs.config.js';
import jpegturboAndroid from '@cpp.js/package-jpegturbo-android/cppjs.config.js';
import zstdAndroid from '@cpp.js/package-zstd-android/cppjs.config.js';
import lercAndroid from '@cpp.js/package-lerc-android/cppjs.config.js';

export default mergeConfig({
    dependencies: [zlibAndroid, jpegturboAndroid, zstdAndroid, lercAndroid],
    paths: { config: import.meta.url },
});
