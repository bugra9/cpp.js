# Bundled toolchain licenses

One place to see the license texts of everything this image redistributes.
Files here are either copied from the toolchain trees inside the image, or
fetched (sha256-pinned) from the exact upstream revisions when the binary
release ships no texts of its own.

| Component | File(s) here | Origin |
| --- | --- | --- |
| wasi-sdk | `wasi-sdk-LICENSE` | fetched: WebAssembly/wasi-sdk @ `wasi-sdk-34-rc.2` (the binary tarball ships no texts) |
| LLVM (both toolchains' runtimes) | `llvm-LICENSE.TXT` | fetched: llvm/llvm-project @ `278c31bf` (wasi-sdk's clang revision; the same text governs the emsdk-side LLVM) |
| wasi-libc | `wasi-libc-LICENSE*` | fetched: WebAssembly/wasi-libc @ `fb2edcef` (wasi-sdk's pinned submodule) |
| swig (bugra9 fork) | `swig-LICENSE*` | fetched: bugra9/swig @ `1b6501ab` (the source tree is removed after `make install`; only the binary stays) |
| emsdk | `emsdk-LICENSE` | copied from `/emsdk` |
| emscripten | `emscripten-LICENSE` | copied from `/emsdk/upstream/emscripten` |
| node (emsdk bundle) | `node-LICENSE` | copied from `/emsdk/node/<version>` |
| Android NDK | `ndk-NOTICE`, `ndk-NOTICE.toolchain` | copied from the NDK root; the NDK is additionally governed by the Android SDK license terms accepted at image build time |
| apt packages (cmake, openjdk, sqlite3, ...) | not duplicated | Debian convention: `/usr/share/doc/<package>/copyright` |
