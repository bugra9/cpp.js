import mergeConfig from '@cpp.js/package-proj/mergeConfig.mjs';
import tiffAndroid from '@cpp.js/package-tiff-android/cppjs.config.js';
import sqlite3Android from '@cpp.js/package-sqlite3-android/cppjs.config.js';

export default mergeConfig({
    dependencies: [tiffAndroid, sqlite3Android],
    paths: { config: import.meta.url },
});
