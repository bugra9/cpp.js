import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import viteCrossbindPlugin from '@crossbind/plugin-vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte(), viteCrossbindPlugin()],
});
