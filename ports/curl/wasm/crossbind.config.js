import mergeConfig from '@crossbind/port-curl/mergeConfig.mjs';
import opensslWasm from '@crossbind/port-openssl-wasm/crossbind.config.js';

export default mergeConfig({
    dependencies: [opensslWasm],
    paths: { config: import.meta.url },
});
