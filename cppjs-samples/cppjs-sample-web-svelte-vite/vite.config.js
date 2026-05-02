import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import viteCppjsPlugin from '@cpp.js/plugin-vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte(), viteCppjsPlugin()],
});
