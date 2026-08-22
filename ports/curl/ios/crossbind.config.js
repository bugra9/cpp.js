import mergeConfig from '@crossbind/port-curl/mergeConfig.mjs';
import opensslIos from '@crossbind/port-openssl-ios/crossbind.config.js';

export default mergeConfig({
    dependencies: [opensslIos],
    paths: { config: import.meta.url },
});
