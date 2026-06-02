import mergeConfig from '@cpp.js/package-sqlite3/mergeConfig.mjs';
import zlibIos from '@cpp.js/package-zlib-ios/cppjs.config.js';

export default mergeConfig({
    dependencies: [zlibIos],
    paths: { config: import.meta.url },
});
