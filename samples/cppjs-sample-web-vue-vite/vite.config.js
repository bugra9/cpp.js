import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import viteCppjsPlugin from 'vite-plugin-cppjs';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        viteCppjsPlugin(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
