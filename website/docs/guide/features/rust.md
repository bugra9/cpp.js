# Using Rust

Cpp.js binds plain Rust the same way it binds C++ headers: one import line, no
proc-macros, no hand-written glue. The same JavaScript works on web, iOS and
Android. (`platform: 'wasi'` skips Rust — there is no wasm32-wasip3 Rust
target yet. The wasm `mt` runtime works but needs nightly Rust: cpp.js
rebuilds std with the atomics features via `-Zbuild-std`, so run
`rustup toolchain install nightly --component rust-src` once.)

Add the binding layer once (bundler plugins already depend on it, so most
projects get it transitively):

```sh
npm install -D @cpp.js/core-embind-rust
```

A Rust toolchain (`cargo` plus the platform targets) must be installed; cargo
itself acts as the incremental cache, so unchanged code rebuilds as a no-op.

## Import a crate directly (`cargo:` scheme)

Use a crates.io crate without writing any local Rust. Declare it in
`cppjs.config.js`, then import it with the `cargo:` prefix — the prefix names
the store, like `node:` does:

```js title="cppjs.config.js"
export default {
    cargoDependencies: {
        uuid: '{ version = "1", features = ["v4"] }',
        semver: '1',
    },
    paths: { config: import.meta.url },
};
```

```js title="JavaScript"
import { initNative } from './native/native.h';
import { Uuid } from 'cargo:uuid';
import { Version, VersionReq } from 'cargo:semver';

await initNative();
const id = Uuid.newV4().toString();
const ok = new VersionReq('^1.2').matches(new Version('1.4.0'));
```

Cpp.js reads the crate's own sources — following module trees, `pub use`
re-exports and enabled feature gates — and generates the bridge from what it
finds. Importing an undeclared crate is a hard error.

## Import an app-local `.rs` file

Write Rust next to your other native sources and import it like a header.
Upstream crates it uses go into the same `cargoDependencies`:

```rust title="src/native/geo_surface.rs"
use geo::{ConvexHull, MultiPoint, Point};

pub struct Hull { points: Vec<Point<f64>> }

impl Hull {
    pub fn new() -> Self { Hull { points: Vec::new() } }
    pub fn add(&mut self, x: f64, y: f64) { self.points.push(Point::new(x, y)); }
    pub fn wkt(&self) -> String { /* … */ }
}
```

```js title="JavaScript"
import { initNative } from './native/native.h';
import { Hull } from './native/geo_surface.rs';
```

## Publish a Rust package

A whole crate can ship as a Cpp.js package: set `export.type: 'cargo'` (see
[Export](/docs/api/configuration/export)). Cpp.js runs
`cargo build --release --target <triple>` per platform and stages the static
library like any prebuilt — consumers import the package name exactly like a
C++ package. The wasm `mt` prebuilt builds through the same nightly
`-Zbuild-std` path described above.

## What plain Rust maps to

| Rust | JavaScript |
| ---- | ---------- |
| `struct` + `impl` methods | class with methods (`Type::new` → constructor) |
| `&str` / `&String` parameters, `String` returns | strings |
| `i32` / `f64` / `bool` | number / boolean |
| `i64` / `u64` | `BigInt` (both directions) |
| `Option<T>` parameters and returns | `null`/`undefined` ↔ `None` |
| `Result<T, E>` returns | throws an `Error` on `Err` |
| `impl Display` | `toString()` |
| free `pub fn` | plain exported function |
| `&OtherClass` parameters | pass the other class's instance |
| `serde_json::Value` parameters and returns | real JS values (objects/arrays/primitives), deep-copied at the boundary |
| `Arc<Class>` factories, parameters and returns | shared ownership: several JS handles co-own one instance, the last `delete()` frees it |
| `embind_rs::JsValue` / `JsFunction` parameters and returns | live JS values by identity (no copy) and callbacks into JS; a JS throw surfaces as `Err` |

`JsValue`/`JsFunction` need a synchronous runtime (native JSI, wasm `st` on
the main thread): on worker-backed runtimes (the wasm `mt` default, or
`initNative({ useWorker: true })`) functions cannot cross the worker boundary and
identity does not survive structured cloning — use `serde_json::Value` there.

## TypeScript

Generated declarations never live in your source tree — everything sits under
`.cppjs/`, and the shared `@cpp.js/typescript-config` package wires all of it.
Add it as a devDependency and extend it once (TS 5.5+; array form when you
already extend another config):

```jsonc title="tsconfig.json"
{ "extends": "@cpp.js/typescript-config" }
```

```jsonc title="tsconfig.json (React Native)"
{ "extends": ["@react-native/typescript-config", "@cpp.js/typescript-config"] }
```

One caveat: `include` is overridden (not merged) when your tsconfig defines
its own — keep `.cppjs/rust-crates/types/**/*.d.ts` in yours in that case.

Running with `initNative({ useWorker: true })`? Set `dts: 'promise'` in
`cppjs.config.js` so every generated signature returns `Promise<...>` to
match the async runtime (write `await new X(...)` for construction).
