import mergeConfig from '@crossbind/port-curl/mergeConfig.mjs';
import opensslAndroid from '@crossbind/port-openssl-android/crossbind.config.js';

export default mergeConfig({
    dependencies: [opensslAndroid],
    paths: { config: import.meta.url },
});
