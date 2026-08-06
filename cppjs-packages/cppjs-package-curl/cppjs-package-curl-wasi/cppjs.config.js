import mergeConfig from '@cpp.js/package-curl/mergeConfig.mjs';
import opensslWasi from '@cpp.js/package-openssl-wasi/cppjs.config.js';

export default mergeConfig({
    dependencies: [opensslWasi],
    paths: { config: import.meta.url },
});
