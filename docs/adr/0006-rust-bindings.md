# ADR-0006: Bind plain Rust through a flat C ABI; the engine never depends on the binding layer

- **Status:** Accepted
- **Date:** 2026-08-02 (architecture), 2026-08-05 (dependency direction)
- **Affects:** `cppjs-core/cppjs-core-embind-rust/`, `cppjs-core/cpp.js/src/utils/{rustBridgeGen,resolveEmbindRust,cargoTarget}.js`, `src/actions/buildCargo.js`, bundler plugins

## Context

Users want Rust in the same one-line-import model cpp.js gives C++. Options
ranged from wasm-bindgen (web-only, no RN) to hand-written glue. cpp.js
already has two embind consumers — emscripten's embind on web and embind-jsi
on mobile — and both materialise classes from the same registration calls.
Separately: `cpp.js` (the engine) must not hard-depend on every binding
layer; the existing rule for `core-embind-jsi` is that consumers depend on
it, never the engine.

## Decision

Rust support is a producer/adapter architecture over a stable flat C ABI:

- A pure-Rust producer crate (`embind-rs`) emits embind registrations through
  `include/cppjs_embind.h` (plain function pointers, no C++ types).
- Per-host adapters translate that ABI: `adapters/web.cpp` → emscripten
  embind, `adapters/jsi.cpp` → embind-jsi. The same Rust archive works on
  web, iOS and Android.
- Bridge crates are **generated from plain Rust source** (no proc-macros):
  the engine parses the crate surface (module trees, `pub use` re-exports,
  feature gates) and emits the bridge.
- **Dependency direction:** the engine never depends on
  `@cpp.js/core-embind-rust`. Consumers declare it (apps as devDependency;
  the bundler plugins carry it as a dependency), and the engine resolves it
  from the consumer (`resolveEmbindRust.js`) with an actionable error when
  absent.

## Consequences

- **Positive** — one Rust archive per app for all platforms; emscripten
  internal-ABI drift is absorbed by the adapters, Rust code never moves;
  users who don't touch Rust pay nothing (no engine dependency).
- **Negative** — the adapters track two embind implementations; the surface
  grammar (what plain Rust maps to) must be documented and extended
  deliberately; source-parsing generation means exotic crate layouts can fall
  outside the parsed grammar.

## Alternatives considered

- **wasm-bindgen** — rejected: web-only, its own ABI, no path to embind-jsi.
- **Proc-macro annotations in user Rust** — rejected: generation from plain
  source proved sufficient and keeps user crates annotation-free.
- **Engine depends on the binding layer** — rejected: violates the
  established `core-embind-jsi` direction rule and taxes non-Rust users.

## See also

- Related code: `docs/api/rust.md`, `cppjs-core/cppjs-core-embind-rust/README.md`
- Related ADRs: ADR-0007 (`cargo:` import scheme)
