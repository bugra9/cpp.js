import jpegturboWasm from '@cpp.js/package-jpegturbo-wasm/cppjs.config.js';

export default {
  dependencies: [
      jpegturboWasm
  ],
  paths: {
    config: import.meta.url
  }
};
