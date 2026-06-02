import mergeConfig from '@cpp.js/package-curl/mergeConfig.mjs';
import opensslAndroid from '@cpp.js/package-openssl-android/cppjs.config.js';

export default mergeConfig({
    dependencies: [opensslAndroid],
    paths: { config: import.meta.url },
});
