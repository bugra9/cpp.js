import mergeConfig from '@cpp.js/package-proj/mergeConfig.mjs';
import tiffIos from '@cpp.js/package-tiff-ios/cppjs.config.js';
import sqlite3Ios from '@cpp.js/package-sqlite3-ios/cppjs.config.js';

export default mergeConfig({
    dependencies: [tiffIos, sqlite3Ios],
    paths: { config: import.meta.url },
});
