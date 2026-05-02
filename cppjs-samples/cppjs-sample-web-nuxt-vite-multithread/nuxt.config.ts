import viteCppjsPlugin from '@cpp.js/plugin-vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Required headers for SharedArrayBuffer (WebAssembly pthreads)
  routeRules: {
    '/**': {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
  },

  vite: {
    plugins: [
      viteCppjsPlugin(),
    ],
  },

})
