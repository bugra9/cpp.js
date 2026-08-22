import mergeConfig from '@crossbind/port-curl/mergeConfig.mjs';
import opensslWasi from '@crossbind/port-openssl-wasi/crossbind.config.js';

export default mergeConfig({
    dependencies: [opensslWasi],
    paths: { config: import.meta.url },
});
