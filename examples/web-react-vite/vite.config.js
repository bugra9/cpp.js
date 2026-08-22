import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCrossbindPlugin from '@crossbind/plugin-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteCrossbindPlugin()],
})
