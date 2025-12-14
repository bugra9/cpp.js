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
  platform: {
    'Android-arm64-v8a': {
      'libType': 'static',
      data: {
        'ssl/certs': 'certs'
      }
    },
    'Android-x86_64': {
      'libType': 'static',
      data: {
        'ssl/certs': 'certs'
      }
    }
  }
};
