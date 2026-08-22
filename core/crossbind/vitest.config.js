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
            // The unit-testable surface: pure helpers, config/state derivation, and the JS
            // runtime that ships into consumer apps. src/actions/ stays out - it shells out to
            // docker/emcc/cargo, so a unit test there would pin the command line rather than
            // behaviour, and the e2e suites already cover that layer.
            include: ['src/utils/**/*.js', 'src/state/**/*.js', 'src/assets/**/*.js'],
            all: true,
            // A floor with a one-point band, not a ratchet. Coverage is not identical across
            // environments - resolveEmbindRust walks the real node_modules layout, so which of its
            // catch branches run differs between a dev machine and a fresh CI install - and the
            // totals land a few hundredths apart. Auto-raising these locally while enforcing them
            // exactly on CI therefore fails on that difference rather than on a regression: CI
            // measured 81.67/76.66/84.31/82.72 against floors written from a local run. These are
            // the CI numbers minus about a point; raise them deliberately when a gain is worth
            // locking in.
            thresholds: {
                statements: 80.6,
                branches: 75.6,
                functions: 83.3,
                lines: 81.7,
            },
        },
    },
});
