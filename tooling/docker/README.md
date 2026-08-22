# @crossbind/docker

**crossbind build images** — the toolchains a crossbind build runs in, so a project needs Docker
and Node and nothing else.

<a href="https://github.com/crossbind/crossbind/pkgs/container/web">
    <img alt="Image registry" src="https://img.shields.io/badge/ghcr.io-crossbind-20B2AA?style=for-the-badge" />
</a>
<a href="https://crossbind.dev/docs/api/cli/run">
    <img alt="Docs - Run Docker Apps" src="https://img.shields.io/badge/Docs_-_Run_Docker_Apps-20B2AA?style=for-the-badge" />
</a>

## The family

| Image | Carries | Platforms |
| --- | --- | --- |
| `base` | Debian, Node, the pinned Rust toolchain, swig, cmake | amd64, arm64 |
| `web` | base + Emscripten, wasi-sdk, the prebuilt Rust sysroots | amd64, arm64 |
| `android` | base + the NDK and the android Rust targets | amd64 only |
| `rust-sysroot` | just the ST/MT Rust sysroots and their manifest | amd64, arm64 |

`web` and `android` are built `FROM base`, so all three share one toolchain layer. Nothing above
Debian is installed here: Node, Rust and Emscripten are copied out of digest-pinned upstream
images, which keeps their build recipes upstream's problem while the runtime layout — PATH, Node
version, `CARGO_HOME`, cache permissions — stays ours to guarantee.

`android` is amd64-only because Google ships the Linux NDK host tools for x86_64 alone; the CLI
pins android builds to that platform even on an arm64 host.

## Building locally

```sh
pnpm build:family          # every image, both architectures where it applies
pnpm build:web             # just one
```

Local builds are tagged `crossbind/<image>:dev`. Point the CLI at them without touching source:

```sh
CROSSBIND_IMAGE_WEB=crossbind/web:dev crossbind build -p wasm
```

`node scripts/smoke-images.js` checks each image on each architecture: pinned tool versions, a
compile that actually runs, writable caches, and the absence of `rust-src` and `RUSTC_BOOTSTRAP`.

## Publishing

`.github/workflows/publish-images.yml`, run by hand. It builds each image on a native runner per
architecture, merges them into a multi-arch index, mirrors the result to Docker Hub by digest, and
emits the digest table the CLI pins against. The image version lives in `VERSION`.

The predecessor — a single image published as `bugra9/cpp.js` — is retired. It stays on Docker Hub
because released CLI versions still pull it; its recipe is in the git history.
