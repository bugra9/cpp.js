# ADR-0009: Own the toolchain images, and run cargo where the build runs

- **Status:** Accepted
- **Date:** 2026-08-22
- **Affects:** `tooling/docker/`, `.github/workflows/publish-image*.yml`, `pullDockerImage.js`, `runCargo.js`, `rustMt.js`, `rustSysroot.js`, `scripts/{pin-docker-image,smoke-images,pack-rust-sysroot}.js`

## Context

One image carried every toolchain and was built `FROM emscripten/emsdk`. That
inherited more than Emscripten: the container's Node was emsdk's version-stamped
copy (the CLI's bridge generation runs on it), and the emscripten cache happened
to be world-writable, which on-demand system-library builds depend on. The image
also hid an asymmetry — it skipped the Android NDK on arm64, so one tag meant two
different toolchains, and every amd64 user pulled ~660 MB of NDK whether or not
they built for Android.

It carried no Rust at all. Rust therefore compiled on the developer's machine,
against a host toolchain whose version had to match by luck: prebuilt Rust
libraries are only consumable by the exact compiler that produced them.

## Decision

Publish a family of images we own, and make the pinned toolchain inside them the
only one a build uses.

- `base` (Debian + Node + Rust + swig) with `web` and `android` built `FROM` it.
  Node, Rust and Emscripten are copied out of digest-pinned upstream images
  rather than installed, so upstream keeps its build recipes and we keep the
  runtime layout: PATH, Node version, `CARGO_HOME`, cache permissions.
- `android` is declared `linux/amd64` only. `web` and `base` are multi-arch.
- One exact-version stable Rust toolchain, everywhere. The MT sysroot is built
  once in a disposable builder stage; `RUSTC_BOOTSTRAP` and `-Zbuild-std` exist
  only there and never reach a published image.
- Every cargo invocation goes through one `runCargo()` that rebuilds the
  environment from an allowlist, injects flags as `CARGO_ENCODED_RUSTFLAGS`, and
  runs from a neutral directory with a crossbind-owned `CARGO_HOME`.
- Cargo runs where the rest of the build runs: inside the container for
  containerized runners, on the host for `RUNNER=LOCAL` and iOS.
- **Build caches stay on the project bind mount** (`.crossbind/`) and the crate
  registry stays in `~/.crossbind/cargo`, mounted in. No named volumes.

## Consequences

- **Positive** — a Rust user needs no host Rust for wasm and android; the
  version-match question disappears because there is one toolchain; a wasm-only
  user no longer pulls the NDK; `pnpm run clear` still removes every build
  artifact, because nothing hides in a volume; cargo's intermediates stay
  readable on the host.
- **Positive** — the arm64/amd64 asymmetry is declared instead of hidden.
- **Negative** — three images to build, publish and verify instead of one, and a
  forced publish order, because `web`/`android` are `FROM base` and buildx
  resolves that from the registry.
- **Negative** — Rust lives in `base`, so a C++-only or wasi-only user carries
  ~762 MB (rustup 545 MB, cargo 19 MB, the sysroots 182 MB) they never use.
  Measured and accepted; there is nothing meaningful to prune, since the bulk is
  LLVM, rustc and the host std.
- **Negative** — writing cargo's target directory through a macOS bind mount is
  slower than a native volume. Accepted deliberately; see the revision below.
- **Negative** — iOS still compiles Rust on the host, so iOS + Rust users keep a
  host toolchain and need the sysroot as a downloadable artifact.

## Alternatives considered

- **Keep one image** — rejected: it cannot express "android is amd64-only"
  except as a hidden `TARGETARCH` branch, and it taxes every amd64 pull with the
  NDK.
- **Split by language (`web-cpp` / `web-rust`)** — rejected: Rust targets
  `wasm32-unknown-emscripten` and emcc links its output, so a Rust-only image
  would still contain all of Emscripten and save nothing. Only the C++-only side
  could shrink, by ~18%, at the cost of doubling the publish matrix and making
  the CLI guess which variant a project needs.
- **Named volumes for `CARGO_HOME` and the cargo target directory** (the
  original plan) — rejected; see the revision below.

### Revision, 2026-08-22: bind mounts instead of named volumes

The plan this ADR came from put the cargo target directory and `CARGO_HOME` in
named volumes, for bind-mount write performance on macOS and Windows. Reverted
before implementation, because the surface it bought was larger than the problem
it solved:

- a volume key scheme per workspace/platform/triple/runtime, plus its lifecycle;
- volumes are born root-owned while containers run as the host uid, so a
  privileged init step was needed to avoid `EACCES`;
- `buildCargo` reads the produced `.a` from the host, which a volume hides, so a
  container-side copy-out step was needed;
- `pnpm run clear` would no longer clear everything;
- and crate sources under `$CARGO_HOME/registry/src/` would have had no host
  path, which was the whole reason bridge generation had to move into the
  container.

With `~/.crossbind/cargo` bind-mounted instead, the registry is shared across
projects, survives `clear`, and stays addressable from the host — so bridge
generation and `parseCrateSurface` remain on the host, and only a path
translation is needed. The accepted cost is unmeasured filesystem slowness.

## See also

- Related ADRs: ADR-0005 (wasi platform), ADR-0006 (rust bindings), ADR-0007 (`cargo:` imports)
- Related code: `tooling/docker/README.md`, `scripts/smoke-images.js`
