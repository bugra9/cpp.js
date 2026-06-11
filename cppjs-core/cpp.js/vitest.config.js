import { defineConfig } from 'vitest/config';

export default defineConfig({
    // loadJs/loadConfig dynamically import config files written to os.tmpdir()
    // during tests. Vite 6 tightened server.fs.allow and rejects those out-of-root
    // paths ("Does the file exist?"); relax the fs check for the test runner.
    server: {
        fs: {
            strict: false,
        },
    },
    test: {
        include: ['test/**/*.test.js'],
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/utils/**/*.js'],
            all: true,
            // Floors just under current coverage: green today, red on regression.
            thresholds: {
                statements: 75,
                branches: 74,
                functions: 76,
                lines: 72,
            },
        },
    },
});
