import opensslWasm from '@cpp.js/package-openssl-wasm/cppjs.config.js';

export default {
  dependencies: [
    opensslWasm,
  ],
  general: {
    name: 'curl'
  },
  export: {
    type: 'cmake'
  },
  paths: {
    config: import.meta.url,
    base: '../..',
    output: 'dist'
  },
  targetSpecs: [
    {
      platform: 'wasm',
      specs: {
        binary: {
          emccFlags: ['-s', 'FETCH']
        }
      }
    }
  ],
};
