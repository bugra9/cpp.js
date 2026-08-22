import mergeConfig from '@crossbind/port-proj/mergeConfig.mjs';
import tiffIos from '@crossbind/port-tiff-ios/crossbind.config.js';
import sqlite3Ios from '@crossbind/port-sqlite3-ios/crossbind.config.js';

export default mergeConfig({
    dependencies: [tiffIos, sqlite3Ios],
    paths: { config: import.meta.url },
});
