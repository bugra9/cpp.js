// A cargo package: cpp.js builds this Rust crate for each platform via buildType 'cargo' and
// stages the .a as a normal prebuilt - no per-project build script.
export default {
    general: {
        name: 'demo',
    },
    export: {
        type: 'cargo',
        libName: ['demo'],
        crate: '.', // Cargo.toml is in this directory
        bindings: {
            // Standalone vector classes are declared here (code stays plain Rust).
            vectors: [{ of: 'i32', name: 'RustIntVector' }],
        },
    },
    paths: {
        config: import.meta.url,
        base: '../..',
        output: 'dist',
    },
};
