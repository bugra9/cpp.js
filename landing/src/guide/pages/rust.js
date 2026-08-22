export default {
    slug: 'rust',
    title: 'Rust',
    description: 'Import a crates.io crate or a local .rs file with the same one-line import.',
    lede: 'Rust binds the way C++ headers do: one import, no proc-macros, no hand-written glue. Bring in a crate straight from crates.io with the `cargo:` scheme, or write Rust next to your other native sources and import the file.',
    blocks: [
        { type: 'h2', id: 'setup', text: 'Setup' },
        {
            type: 'p',
            text: 'A Rust toolchain (`cargo` plus the platform targets) has to be installed - cargo doubles as the incremental cache, so unchanged code rebuilds as a no-op. The binding layer is a single dev dependency, and bundler plugins already depend on it, so most projects get it transitively:',
        },
        { type: 'code', file: 'shell', code: 'npm install -D @crossbind/core-embind-rust' },
        {
            type: 'callout',
            tone: 'warn',
            title: 'Two limits worth knowing up front',
            text: '`platform: \'wasi\'` skips Rust entirely - there is no `wasm32-wasip3` Rust target yet. And the wasm `mt` runtime needs nightly, because std is rebuilt with the atomics features: run `rustup toolchain install nightly --component rust-src` once.',
        },

        { type: 'h2', id: 'cargo-imports', text: 'Import a crate directly' },
        {
            type: 'p',
            text: 'Declare the crate in `crossbind.config.js`, then import it with the `cargo:` prefix - the prefix names the store, the way `node:` does. Importing an undeclared crate is a hard error, not a silent miss.',
        },
        {
            type: 'code',
            file: 'crossbind.config.js',
            code: `export default {
    cargoDependencies: {
        uuid: '{ version = "1", features = ["v4"] }',
        semver: '1',
    },
    paths: { config: import.meta.url },
};`,
        },
        {
            type: 'code',
            file: 'src/main.js',
            code: `import { initNative, Uuid } from 'cargo:uuid';
import { Version, VersionReq } from 'cargo:semver';

await initNative();

const id = Uuid.newV4().toString();
const ok = new VersionReq('^1.2').matches(new Version('1.4.0'));`,
        },
        {
            type: 'p',
            text: 'The crate\'s own sources are read - module trees, `pub use` re-exports, enabled feature gates - and the bridge is generated from what is found there. You write no Rust at all.',
        },

        { type: 'h2', id: 'local-rs', text: 'Import a local .rs file' },
        {
            type: 'p',
            text: 'Rust can also sit beside your C++ under `src/native` and be imported like a header. Upstream crates it uses go into the same `cargoDependencies` map.',
        },
        {
            type: 'code',
            file: 'src/native/geo_surface.rs',
            code: `use geo::{ConvexHull, MultiPoint, Point};

pub struct Hull { points: Vec<Point<f64>> }

impl Hull {
    pub fn new() -> Self { Hull { points: Vec::new() } }
    pub fn add(&mut self, x: f64, y: f64) { self.points.push(Point::new(x, y)); }
    pub fn wkt(&self) -> String { /* ... */ }
}`,
        },
        {
            type: 'code',
            file: 'src/main.js',
            code: `import { initNative } from './native/native.h';
import { Hull } from './native/geo_surface.rs';`,
        },

        { type: 'h2', id: 'mapping', text: 'What plain Rust maps to' },
        {
            type: 'table',
            head: ['Rust', 'JavaScript'],
            rows: [
                ['`struct` + `impl` methods', 'class with methods (`Type::new` becomes the constructor)'],
                ['`&str` / `&String` parameters, `String` returns', 'strings'],
                ['`i32` / `f64` / `bool`', 'number / boolean'],
                ['`i64` / `u64`', '`BigInt`, both directions'],
                ['`Option<T>`', '`null` / `undefined` ↔ `None`'],
                ['`Result<T, E>` returns', 'throws an `Error` on `Err`'],
                ['`impl Display`', '`toString()`'],
                ['free `pub fn`', 'plain exported function'],
                ['`&OtherClass` parameters', 'pass the other class\'s instance'],
                ['`serde_json::Value`', 'real JS values, deep-copied at the boundary'],
                ['`Arc<Class>`', 'shared ownership across several JS handles'],
                ['`embind_rs::JsValue` / `JsFunction`', 'live JS values by identity, and callbacks into JS'],
            ],
        },
        {
            type: 'callout',
            tone: 'warn',
            title: 'JsValue and JsFunction need a synchronous runtime',
            text: 'Native JSI or wasm `st` on the main thread. Functions cannot cross a worker boundary and identity does not survive structured cloning, so on worker-backed runtimes - the `mt` default, or `useWorker: true` - use `serde_json::Value` instead.',
        },

        { type: 'h2', id: 'publish', text: 'Publish a crate as a package' },
        {
            type: 'p',
            text: 'A whole crate can ship as a package: set `export.type: \'cargo\'` and `cargo build --release --target <triple>` runs per platform, staging the static library like any other prebuilt. Consumers import the package name exactly as they would a C++ one.',
        },
        {
            type: 'code',
            file: 'crossbind.config.js',
            code: `export default {
    export: {
        type: 'cargo',
        crate: '.',
    },
    paths: { config: import.meta.url },
};`,
        },

        { type: 'h2', id: 'typescript', text: 'TypeScript' },
        {
            type: 'p',
            text: 'Generated declarations live under `.crossbind/`, never in your source tree, and `@crossbind/typescript-config` wires them. One caveat: when your own tsconfig defines `include`, it overrides rather than merges - keep `.crossbind/rust-crates/types/**/*.d.ts` in yours.',
        },
        {
            type: 'code',
            file: 'tsconfig.json',
            code: '{ "extends": "@crossbind/typescript-config" }',
        },
        {
            type: 'p',
            text: 'The same `dts: \'promise\'` note from [C++ bindings](/guide/bindings/#typescript) applies here.',
        },
    ],
};
