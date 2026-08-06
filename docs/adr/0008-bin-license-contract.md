# ADR-0008: Govern published binaries with a derived Bin & License Contract

- **Status:** Accepted
- **Date:** 2026-07-27 (K1-K3), completed 2026-08-06 (K4 + placement)
- **Affects:** `cppjs-packages/README.md` (the contract), `cppjs-core/cpp.js/src/actions/{buildBinTools,licenses}.js`, `src/utils/{binTools,provenance,licenseReport,familyManifest}.js`, `scripts/{check-publish-hygiene,generate-third-party}.js`

## Context

Shipping upstream CLI tools as npm packages means distributing statically
linked aggregates of a dozen third-party libraries. Hand-maintained tool
lists, NOTICE files and license fields rot silently and are wrong per
variant; executables leaking out of *library* packages is a licensing
hazard; and an opaque binary invites the question "what exactly is in this
and how was it built?".

## Decision

Everything a binary-publishing package ships is **derived from single
sources and machine-enforced** — the Bin & License Contract
(`cppjs-packages/README.md`), four rules:

- **K1** — library packages never publish executables (checker gate over
  `npm pack` output).
- **K2** — `-bin` packages declare their tool surface as data (the recipe
  `bin` map); the engine derives npm commands, `.npmignore`,
  `cppjs-bin.json` and the multicall multitool.
- **K3** — NOTICE/SBOM are derived at build time from recipe metadata
  (`cppjs licenses`), keyed per variant, never hand-written.
- **K4** — `-bin` packages carry a derived `cppjs.provenance` block and a
  derived compound `license` field (the AND of every statically linked
  component's effective license).

Placement: the distribution's home is cpp.js — users install the `-bin`
package directly; no product-package wrapper. The contract is
placement-independent: if that ever changes, the rules travel with the
binaries.

## Consequences

- **Positive** — tool surface, notices, SBOM, provenance and the license
  field cannot drift from the build reality; violations fail `pnpm check`
  before they reach npm; honest license fields surface copyleft content
  (e.g. a geos binary declares its LGPL component) instead of hiding it
  behind a wrapper's MIT.
- **Negative** — the checker runs `npm pack --dry-run` across the package
  tree (minutes); package.json fields are machine-owned (hand edits get
  overwritten by the next build); the derived license expressions are long.

## Alternatives considered

- **Hand-maintained NOTICE/license fields** — rejected: per-variant accuracy
  is exactly what humans get wrong; a correct NOTICE on the wrong variant is
  worse than none.
- **Post-hoc SBOM scanners (syft-class)** — rejected as the source of truth:
  they guess from the finished artifact; cpp.js knows the link-time ground
  truth.
- **"Build but don't publish" for library executables** — rejected: don't
  build at all; no licensed artifact should ever exist in dist.

## See also

- Related code: `cppjs-packages/README.md`, `docs/playbooks/licensing-lgpl.md`
- Related ADRs: ADR-0005 (wasi platform)
