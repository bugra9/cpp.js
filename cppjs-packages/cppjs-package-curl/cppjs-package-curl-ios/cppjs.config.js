import mergeConfig from '@cpp.js/package-curl/mergeConfig.mjs';
import opensslIos from '@cpp.js/package-openssl-ios/cppjs.config.js';

export default mergeConfig({
    dependencies: [opensslIos],
    paths: { config: import.meta.url },
});
