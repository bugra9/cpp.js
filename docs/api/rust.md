# Rust — first-class bindings

> Import plain Rust into JavaScript the same way you import a C++ header:
> classes, methods, free functions — one import line, no proc-macros, no
> hand-written glue. Works on web (emscripten embind), iOS and Android
> (embind-jsi) with the same JS code; `platform: 'wasi'` skips Rust (no
> wasm32-wasip3 Rust target yet). The wasm `mt` runtime works too but needs
> nightly Rust: cpp.js rebuilds std with the atomics/bulk-memory features via
> `-Zbuild-std` (run `rustup toolchain install nightly --component rust-src`
> once; without it the build fails with that exact instruction).

## Requirement

The engine does not depend on the Rust layer — the consumer declares it:

```bash
pnpm add -D @cpp.js/core-embind-rust
```

Bundler plugins (`@cpp.js/plugin-vite`, `-rollup`, `-webpack`, `-react-native`) already
carry it as a dependency, so plugin users usually get it transitively. A
Rust toolchain (`cargo` + the platform targets) must be installed; cargo
itself is the incremental cache — rebuilds are no-ops when nothing changed.

## Three import models

### 1. Direct crate import (`cargo:` scheme)

Import straight from a crates.io crate — no local Rust file at all. Declare
the crate in `cppjs.config.js`, then import with the `cargo:` prefix (the
`node:`/`npm:` convention: the prefix names the store):

```js
// cppjs.config.js — top level, next to `dependencies`
cargoDependencies: {
  uuid: '{ version = "1", features = ["v4"] }',
  semver: '1',
},
```

```js
import { init } from 'cpp.js'
import { Uuid } from 'cargo:uuid'
import { Version, VersionReq } from 'cargo:semver'

await init()
const id = Uuid.newV4().toString()
const ok = new VersionReq('^1.2').matches(new Version('1.4.0'))
```

cpp.js reads the crate's own sources (following `mod` trees, `pub use`
re-exports and enabled feature gates) and generates the bridge crate from
what it finds. An undeclared `cargo:` import is a hard error — add the
crate to `cargoDependencies`.

### 2. App-local `.rs` source

Write a Rust file next to your other native sources and import it like a
header. Upstream crates it uses go into the same `cargoDependencies`:

```rust
// src/native/geo_surface.rs
use geo::{ConvexHull, MultiPoint, Point};

pub struct Hull { points: Vec<Point<f64>> }

impl Hull {
    pub fn new() -> Self { Hull { points: Vec::new() } }
    pub fn add(&mut self, x: f64, y: f64) { self.points.push(Point::new(x, y)); }
    pub fn wkt(&self) -> String { /* … */ }
}
```

```js
import { init } from 'cpp.js'
import { Hull } from './native/geo_surface.rs'
```

### 3. Rust cpp.js package

A whole crate published as a cpp.js package: `export.type: 'cargo'` in its
`cppjs.config.js` (see [`cppjs-config.md`](./cppjs-config.md)). cpp.js runs
`cargo build --release --target <triple>` per platform and stages the `.a`
like any prebuilt; consumers import the package name exactly like a C++
package. The wasm `mt` prebuilt builds through the same nightly `-Zbuild-std`
path described above (st and mt cargo outputs are kept in separate target
dirs — they share a triple but not their std features).

## What plain Rust maps to

| Rust | JavaScript |
|------|------------|
| `struct` + `impl` methods | class with methods (`Type::new` → constructor) |
| `&str` / `&String` params, `String` returns | JS strings |
| `i32` / `f64` / `bool` | number / boolean |
| `i64` / `u64` | `BigInt` (both directions) |
| `Option<T>` params and returns | `null`/`undefined` ↔ `None` |
| `Result<T, E>` returns | throws a JS `Error` on `Err` |
| `impl Display` | `toString()` |
| free `pub fn` | plain exported function |
| `&OtherClass` params | pass the other class's instance |
| `serde_json::Value` params and returns | real JS values (objects/arrays/primitives), deep-copied at the boundary |
| `Arc<Class>` factories, params and returns | shared ownership: several JS handles co-own one instance, the last `delete()` frees it (shared classes use `&self` methods and Arc factories) |
| `embind_rs::JsValue` / `JsFunction` params and returns | live JS values by identity (no copy) and callbacks into JS; a JS throw surfaces as `Err` (import them from `embind_rs` — the one engine import in user code) |

`JsValue`/`JsFunction` need a synchronous runtime (native JSI, wasm `st` on the
main thread): on worker-backed runtimes (the wasm `mt` default, or
`init({ useWorker: true })`) functions cannot cross the worker boundary and
identity does not survive structured cloning — use `serde_json::Value` there.

The full grammar, wire contract and builder API live in
`cppjs-core/cppjs-core-embind-rust/README.md`.

## Editor types

Generated declarations never live in your source tree — everything sits under
`.cppjs/`, and the shared `@cpp.js/typescript-config` package wires all of it.
Install it as a direct devDependency and extend it once:

```jsonc
// tsconfig.json (TS 5.5+; array form when you already extend another config)
{ "extends": "@cpp.js/typescript-config" }
{ "extends": ["@react-native/typescript-config", "@cpp.js/typescript-config"] }
```

Running with `init({ useWorker: true })`? Set `dts: 'promise'` in
`cppjs.config.js` so generated signatures match the async runtime — see
[`lifecycle-and-types.md`](./lifecycle-and-types.md).

Under the hood the fragment carries two different mechanisms: `cargo:` crates
are non-relative module names, so their declarations are ambient
(`declare module 'cargo:<name>'`, under `.cppjs/rust-crates/types/`, pulled in
via `include`); `./x.rs` imports are relative and typed by path resolution
(TypeScript does not allow ambient declarations for relative names), so their
declarations mirror the project-relative path under `.cppjs/types/` and
`rootDirs` overlays the two roots. Caveats: `include` is overridden (not
merged) when your tsconfig defines its own — keep
`.cppjs/rust-crates/types/**/*.d.ts` in yours in that case; and if you
override `paths.cache`, copy the two settings with your custom path instead.

## See also

- [`cppjs-config.md`](./cppjs-config.md) — `cargoDependencies`, `export.type: 'cargo'`, `export.crate`.
- [`cpp-binding-rules.md`](./cpp-binding-rules.md) — the C++ counterpart of this page.
- Canonical demos: `cppjs-samples/cppjs-playground-web-vite` (all three models on web), `cppjs-samples/cppjs-playground-mobile-reactnative-cli` (the same surface on devices), `cppjs-core/cppjs-core-embind-rust/demo` (a cargo-type package).
