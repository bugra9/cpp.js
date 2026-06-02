import mergeConfig from '@cpp.js/package-geotiff/mergeConfig.mjs';
import projIos from '@cpp.js/package-proj-ios/cppjs.config.js';
import tiffIos from '@cpp.js/package-tiff-ios/cppjs.config.js';
import zlibIos from '@cpp.js/package-zlib-ios/cppjs.config.js';
import jpegturboIos from '@cpp.js/package-jpegturbo-ios/cppjs.config.js';

export default mergeConfig({
    dependencies: [projIos, tiffIos, zlibIos, jpegturboIos],
    paths: { config: import.meta.url },
});
