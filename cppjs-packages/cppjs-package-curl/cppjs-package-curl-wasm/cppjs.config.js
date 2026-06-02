import mergeConfig from '@cpp.js/package-curl/mergeConfig.mjs';
import opensslWasm from '@cpp.js/package-openssl-wasm/cppjs.config.js';

export default mergeConfig({
    dependencies: [opensslWasm],
    paths: { config: import.meta.url },
});
