import mergeConfig from '@cpp.js/package-zstd/mergeConfig.mjs';
import wasiVariant from '@cpp.js/package-zstd-wasi/cppjs.config.js';

// Same dependency set as the -wasi library variant; only the recipe (cppjs.build.js) differs.
export default mergeConfig({
    dependencies: wasiVariant.dependencies || [],
    paths: { config: import.meta.url },
});
