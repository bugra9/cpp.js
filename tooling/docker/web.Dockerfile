# syntax=docker/dockerfile:1

# wasm + wasi targets: Emscripten, the wasi-sdk, and the prebuilt Rust sysroots.
# The emscripten tree is copied out of the digest-pinned upstream image, but its bundled Node is
# not: NODE_JS points at the base image's Node so the container's Node version is our decision and
# not a side effect of the emsdk pin (the CLI's bridge generation runs on it).

ARG BASE_IMAGE=crossbind/base:dev
ARG RUST_SYSROOT_IMAGE=crossbind/rust-sysroot:dev

# Digest-pinned (multi-arch INDEX): buildx materializes amd64+arm64 from it; bump via `docker manifest inspect emscripten/emsdk:<tag>`.
FROM emscripten/emsdk:6.0.2@sha256:644883f58ca15c38c8be59b3a727ba0eff347729bc31d50a3348a6c9ed92bc07 AS emsdk
FROM ${RUST_SYSROOT_IMAGE} AS sysroot

FROM ${BASE_IMAGE} AS web

ENV EMSDK=/emsdk \
    EM_CONFIG=/emsdk/.emscripten \
    EM_CACHE=/emsdk/upstream/emscripten/cache \
    EMSDK_NODE=/usr/local/bin/node \
    PATH=/emsdk/upstream/emscripten:/usr/local/cargo/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

COPY --from=emsdk /emsdk/upstream /emsdk/upstream
COPY --from=emsdk /emsdk/LICENSE /opt/licenses/emsdk-LICENSE
COPY --from=emsdk /emsdk/upstream/emscripten/LICENSE /opt/licenses/emscripten-LICENSE

# Written here rather than copied: upstream's config derives NODE_JS from a version-stamped path
# under /emsdk/node, which we deliberately do not ship.
RUN printf '%s\n' \
        "NODE_JS = '/usr/local/bin/node'" \
        "LLVM_ROOT = '/emsdk/upstream/bin'" \
        "BINARYEN_ROOT = '/emsdk/upstream'" \
        "EMSCRIPTEN_ROOT = '/emsdk/upstream/emscripten'" \
        > /emsdk/.emscripten

WORKDIR /emsdk/upstream/emscripten/src/lib
# Pinned to crossbind/emscripten@583984a, sha256-verified.
RUN wget -q https://raw.githubusercontent.com/crossbind/emscripten/583984a6c8feca8953f033e0bddd2d566b03fe86/src/lib/libembind.js -O libembind.js && \
    echo "589aa78e3e6781298e575ef7d5971e0cc22ebc4a1c959af2c7d499052734fea8  libembind.js" | sha256sum -c -

WORKDIR /emsdk/upstream/emscripten
RUN sed -i 's/smart_ptr<SmartPtr>(smartPtrName);/ /g' ./system/include/emscripten/bind.h
RUN sed -i 's/smart_ptr<SmartPtr>(smartPtrName);/ /g' ./cache/sysroot/include/emscripten/bind.h

# On-demand system-library builds write here, and containers run as the host uid; owning the mode
# ourselves is what makes the release gate's cache-writability assert a contract rather than a hope.
RUN chmod -R 0777 "${EM_CACHE}"

COPY --from=sysroot /opt/crossbind/rust /opt/crossbind/rust

# rustc takes --sysroot globally, and build scripts and proc-macros compile for the HOST - so each
# variant has to be a complete sysroot, not just the wasm tree. Linking the toolchain's own host
# target in costs nothing and makes `--sysroot <variant>` correct for every unit in the graph.
# `current` keeps the version out of the CLI: it points at whatever this image shipped.
RUN set -eu; \
    host="$(rustc -vV | sed -n 's/^host: //p')"; \
    version="$(ls /opt/crossbind/rust)"; \
    for variant in st mt; do \
      ln -s "/usr/local/rustup/toolchains/${version}-${host}/lib/rustlib/${host}" \
            "/opt/crossbind/rust/${version}/${variant}/lib/rustlib/${host}"; \
    done; \
    ln -s "/opt/crossbind/rust/${version}" /opt/crossbind/rust/current; \
    test -d "/opt/crossbind/rust/current/mt/lib/rustlib/${host}"

# Prove each sysroot is consumable the way the CLI will consume it - stable rustc, no -Z, the same
# target features and panic strategy. A sysroot whose std was built with a different panic strategy
# compiles fine here and fails in the consumer with "does not have the panic strategy", so the
# image build is where that has to surface.
RUN set -eu; \
    mkdir -p /tmp/sysroot-probe/src; cd /tmp/sysroot-probe; \
    printf '[package]\nname="probe"\nversion="0.0.0"\nedition="2021"\n[lib]\ncrate-type=["staticlib"]\n[profile.release]\npanic="abort"\n[workspace]\n' > Cargo.toml; \
    printf 'pub fn f() -> usize { vec![1u32,2,3].iter().sum::<u32>() as usize }\n' > src/lib.rs; \
    sep="$(printf '\037')"; \
    for variant in st mt; do \
      features=""; \
      [ "$variant" = mt ] && features="${sep}-Ctarget-feature=+atomics,+bulk-memory,+mutable-globals"; \
      CARGO_HOME=/tmp/sysroot-probe/.cargo \
      CARGO_ENCODED_RUSTFLAGS="--sysroot${sep}/opt/crossbind/rust/current/${variant}${features}" \
        cargo build --release --target wasm32-unknown-emscripten --target-dir "/tmp/sysroot-probe/t-${variant}"; \
    done; \
    rm -rf /tmp/sysroot-probe

# /opt/wasi-sdk is run.js's fallback when no host WASI_SDK_PATH is set; sha256-pinned per arch.
WORKDIR /opt
ARG TARGETARCH
RUN case "$TARGETARCH" in \
      arm64) WASI_ARCH=arm64;  WASI_SHA=211a2e26d068d3241e51b6e781b480542aa7c63bb544527acb70655ac46d9eb0 ;; \
      *)     WASI_ARCH=x86_64; WASI_SHA=12ad05db5cb7e8d949b5383b84f2b7d169e6db33538f97d62a9eb7ac4e985daa ;; \
    esac && \
    wget -q https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-34-rc.3/wasi-sdk-34.0-rc.3-${WASI_ARCH}-linux.tar.gz -O wasi-sdk.tar.gz && \
    echo "${WASI_SHA}  wasi-sdk.tar.gz" | sha256sum -c - && \
    tar -xzf wasi-sdk.tar.gz && \
    mv wasi-sdk-34.0-rc.3-${WASI_ARCH}-linux wasi-sdk && \
    rm wasi-sdk.tar.gz

# Texts for redistributed toolchains whose releases ship none; pinned to the built revisions.
WORKDIR /opt/licenses
RUN wget -q https://raw.githubusercontent.com/WebAssembly/wasi-sdk/wasi-sdk-34-rc.3/LICENSE -O wasi-sdk-LICENSE && \
    wget -q https://raw.githubusercontent.com/llvm/llvm-project/7196f931f212/LICENSE.TXT -O llvm-LICENSE.TXT && \
    wget -q https://raw.githubusercontent.com/WebAssembly/wasi-libc/2e6fb9d8ee0c/LICENSE -O wasi-libc-LICENSE && \
    wget -q https://raw.githubusercontent.com/WebAssembly/wasi-libc/2e6fb9d8ee0c/LICENSE-APACHE -O wasi-libc-LICENSE-APACHE && \
    wget -q https://raw.githubusercontent.com/WebAssembly/wasi-libc/2e6fb9d8ee0c/LICENSE-APACHE-LLVM -O wasi-libc-LICENSE-APACHE-LLVM && \
    wget -q https://raw.githubusercontent.com/WebAssembly/wasi-libc/2e6fb9d8ee0c/LICENSE-MIT -O wasi-libc-LICENSE-MIT && \
    printf '%s\n' \
      "268872b9816f90fd8e85db5a28d33f8150ebb8dd016653fb39ef1f94f2686bc5  wasi-sdk-LICENSE" \
      "8d85c1057d742e597985c7d4e6320b015a9139385cff4cbae06ffc0ebe89afee  llvm-LICENSE.TXT" \
      "2711a8b5a5cdfef0e639f96c1aca12ae23d7d64a02d0507f1bdf14d2b27bbc3a  wasi-libc-LICENSE" \
      "a60eea817514531668d7e00765731449fe14d059d3249e0bc93b36de45f759f2  wasi-libc-LICENSE-APACHE" \
      "268872b9816f90fd8e85db5a28d33f8150ebb8dd016653fb39ef1f94f2686bc5  wasi-libc-LICENSE-APACHE-LLVM" \
      "23f18e03dc49df91622fe2a76176497404e46ced8a715d9d2b67a7446571cca3  wasi-libc-LICENSE-MIT" \
      | sha256sum -c -

WORKDIR /
