import mergeConfig from '@cpp.js/package-geotiff/mergeConfig.mjs';
import projAndroid from '@cpp.js/package-proj-android/cppjs.config.js';
import tiffAndroid from '@cpp.js/package-tiff-android/cppjs.config.js';
import zlibAndroid from '@cpp.js/package-zlib-android/cppjs.config.js';
import jpegturboAndroid from '@cpp.js/package-jpegturbo-android/cppjs.config.js';

export default mergeConfig({
    dependencies: [projAndroid, tiffAndroid, zlibAndroid, jpegturboAndroid],
    paths: { config: import.meta.url },
});
