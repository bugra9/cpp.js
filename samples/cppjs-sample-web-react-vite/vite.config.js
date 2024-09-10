import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import viteCppjsPlugin from 'vite-plugin-cppjs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteCppjsPlugin()],
})
