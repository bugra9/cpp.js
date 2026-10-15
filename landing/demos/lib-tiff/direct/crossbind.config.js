import tiffWasm from '@crossbind/port-tiff-wasm/crossbind.config.js';

// No C++ in this project: every binding comes from the port headers the JavaScript imports.
export default {
    general: { name: 'tiffdirect' },
    dependencies: [tiffWasm],
    paths: { config: import.meta.url },
};
