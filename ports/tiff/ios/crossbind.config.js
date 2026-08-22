import mergeConfig from '@crossbind/port-tiff/mergeConfig.mjs';
import zlibIos from '@crossbind/port-zlib-ios/crossbind.config.js';
import jpegturboIos from '@crossbind/port-jpegturbo-ios/crossbind.config.js';
import zstdIos from '@crossbind/port-zstd-ios/crossbind.config.js';
import lercIos from '@crossbind/port-lerc-ios/crossbind.config.js';

export default mergeConfig({
    dependencies: [zlibIos, jpegturboIos, zstdIos, lercIos],
    paths: { config: import.meta.url },
});
