import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.test.js'],
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/utils/**/*.js'],
        },
    },
});
