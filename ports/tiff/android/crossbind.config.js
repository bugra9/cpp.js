import mergeConfig from '@crossbind/port-tiff/mergeConfig.mjs';
import zlibAndroid from '@crossbind/port-zlib-android/crossbind.config.js';
import jpegturboAndroid from '@crossbind/port-jpegturbo-android/crossbind.config.js';
import zstdAndroid from '@crossbind/port-zstd-android/crossbind.config.js';
import lercAndroid from '@crossbind/port-lerc-android/crossbind.config.js';

export default mergeConfig({
    dependencies: [zlibAndroid, jpegturboAndroid, zstdAndroid, lercAndroid],
    paths: { config: import.meta.url },
});
