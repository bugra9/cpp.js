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
    'iOS-iphoneos': {
      'data': {
        'ssl/certs': 'certs'
      }
    },
    'iOS-iphonesimulator': {
      'data': {
        'ssl/certs': 'certs'
      }
    }
  }
};
