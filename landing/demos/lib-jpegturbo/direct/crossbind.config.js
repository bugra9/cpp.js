import jpegturboWasm from '@crossbind/port-jpegturbo-wasm/crossbind.config.js';

// No C++ in this project: every binding comes from the port headers the JavaScript imports.
export default {
    general: { name: 'jpegturbodirect' },
    dependencies: [jpegturboWasm],
    paths: { config: import.meta.url },
};
