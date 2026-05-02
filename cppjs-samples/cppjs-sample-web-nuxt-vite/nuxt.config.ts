import viteCppjsPlugin from '@cpp.js/plugin-vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  vite: {
    plugins: [
      viteCppjsPlugin(),
    ],
  },

})
