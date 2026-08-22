import mergeConfig from '@crossbind/port-geotiff/mergeConfig.mjs';
import projIos from '@crossbind/port-proj-ios/crossbind.config.js';
import tiffIos from '@crossbind/port-tiff-ios/crossbind.config.js';
import zlibIos from '@crossbind/port-zlib-ios/crossbind.config.js';
import jpegturboIos from '@crossbind/port-jpegturbo-ios/crossbind.config.js';

export default mergeConfig({
    dependencies: [projIos, tiffIos, zlibIos, jpegturboIos],
    paths: { config: import.meta.url },
});
