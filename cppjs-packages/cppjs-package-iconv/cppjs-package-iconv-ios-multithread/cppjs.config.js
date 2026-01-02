export default {
  general: {
    name: 'iconv'
  },
  export: {
    type: 'cmake',
    libName: [
      'iconv',
      'charset'
    ]
  },
  paths: {
    config: import.meta.url,
    base: '../..',
    output: 'dist'
  },

};
