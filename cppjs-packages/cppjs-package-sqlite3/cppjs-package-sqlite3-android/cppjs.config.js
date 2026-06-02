import mergeConfig from '@cpp.js/package-sqlite3/mergeConfig.mjs';
import zlibAndroid from '@cpp.js/package-zlib-android/cppjs.config.js';

export default mergeConfig({
    dependencies: [zlibAndroid],
    paths: { config: import.meta.url },
});
