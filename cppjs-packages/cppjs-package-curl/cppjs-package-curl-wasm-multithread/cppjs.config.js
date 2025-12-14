import opensslWasmMultithread from '@cpp.js/package-openssl-wasm-multithread/cppjs.config.js';

export default {
    dependencies: [
        opensslWasmMultithread,
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
  build: {
    usePthread: true
  },
  platform: {
    'Emscripten-x86_64': {
      binary: {
        emccFlags: [
          '-s',
          'FETCH'
        ]
      }
    }
  }
};
