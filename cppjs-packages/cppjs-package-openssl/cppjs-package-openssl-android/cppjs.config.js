export default {
  general: {
    name: 'openssl'
  },
  export: {
    type: 'cmake',
    libName: [
      'ssl',
      'crypto'
    ]
  },
  paths: {
    config: import.meta.url,
    base: '../..',
    output: 'dist'
  },
  targetSpecs: [
    {
      platform: 'android',
      specs: {
        libType: 'static',
        data: {
          'ssl/certs': 'certs'
        }
      }
    }
  ],
};
