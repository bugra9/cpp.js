import { conformanceExport } from '@crossbind/conformance/config.mjs';
import embindRustDemo from '@crossbind/embind-rust-demo/crossbind.config.mjs';
import conformanceRust from '@crossbind/conformance-rust/crossbind.config.mjs';

export default {
    general: {
        name: 'crossbind-e2e-desktop-app',
    },
    // The crates src/main.js imports as `cargo:<crate>`, bridged from their own sources.
    cargoDependencies: {
        uuid: '{ version = "1", features = ["v4"] }',
        semver: '1',
        regex: '1',
        'xxhash-rust': '{ version = "0.8", features = ["xxh3", "xxh64", "xxh32"] }',
        'argon2-rust': '1.1',
        'lzma-rust2': '0.16',
    },
    dependencies: [embindRustDemo, conformanceRust],
    export: conformanceExport,
    target: {
        runtimeEnv: 'app',
    },
    // Smaller than every runner's display, which would hold the window to less; src/main.js checks the page has it.
    app: {
        window: { width: 800, height: 600 },
        // src/main.js checks the page opens files in the data folder alone.
        openPath: ['data'],
    },
    paths: {
        config: import.meta.url,
        base: '../..',
        header: ['../conformance/native'],
    },
};
