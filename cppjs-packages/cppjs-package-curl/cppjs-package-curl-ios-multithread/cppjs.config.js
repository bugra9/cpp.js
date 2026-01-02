import opensslIosMultithread from '@cpp.js/package-openssl-ios-multithread/cppjs.config.js';

export default {
  dependencies: [
    opensslIosMultithread,
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
      specs: {
        env: {
          'CURL_CA_BUNDLE': '_CPPJS_DATA_PATH_/certs/cacert.pem'
        }
      }
    }
  ],
};
