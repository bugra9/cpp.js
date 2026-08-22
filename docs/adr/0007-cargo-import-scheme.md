# ADR-0007: Prefix direct crate imports with `cargo:`

- **Status:** Accepted
- **Date:** 2026-08-05
- **Affects:** `core/crossbind/src/integration/getDependFilePath.js`, bundler plugins (vite/rollup/metro), the top-level `cargoDependencies` config map, generated `.crossbind/rust-crates/types/`

## Context

Direct crate imports let JS import a crates.io crate with no local Rust file.
The first implementation used bare names (`import { Uuid } from 'uuid'`),
which collides head-on with the npm namespace: `uuid` and `semver` are also
npm packages, so resolution needed shadowing rules and importer-origin guards
to avoid hijacking `node_modules` code — fragile, and a dependency-confusion
hazard in the making.

## Decision

Crate imports carry an explicit store prefix: `import { Uuid } from
'cargo:uuid'` — the `node:`/`npm:`/`jsr:` convention. Rules:

- The bare-name path, its shadowing rules and the importer-origin guard are
  removed entirely.
- An undeclared `cargo:` import is a hard error pointing at the top-level
  `cargoDependencies` map.
- Ambient TypeScript declarations are emitted per crate as
  `declare module 'cargo:<name>'`.

## Consequences

- **Positive** — zero ambiguity with npm names; resolution needs no guards;
  the import line documents its own origin; type declarations get a stable
  module id.
- **Negative** — a crossbind-specific module scheme bundlers only understand
  through our plugins; version choice lives in config rather than the
  specifier (a `cargo:x@1` form stays open for later).

## Alternatives considered

- **Bare names + shadowing guard** — implemented first, rejected: collision
  surface with npm names and silent-hijack risk.
- **Path-style pseudo-imports** (`./crates/uuid`) — rejected: lies about
  there being a file, breaks tooling that resolves paths.

## See also

- Related code: `docs/api/rust.md`
- Related ADRs: ADR-0006 (Rust binding architecture)
