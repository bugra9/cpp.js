import mergeConfig from '@crossbind/port-geotiff/mergeConfig.mjs';
import projAndroid from '@crossbind/port-proj-android/crossbind.config.js';
import tiffAndroid from '@crossbind/port-tiff-android/crossbind.config.js';
import zlibAndroid from '@crossbind/port-zlib-android/crossbind.config.js';
import jpegturboAndroid from '@crossbind/port-jpegturbo-android/crossbind.config.js';

export default mergeConfig({
    dependencies: [projAndroid, tiffAndroid, zlibAndroid, jpegturboAndroid],
    paths: { config: import.meta.url },
});
