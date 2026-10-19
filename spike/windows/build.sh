#!/bin/bash
# Windows apps spike: builds the Hermes release crossbind pins with llvm-mingw for x64 and arm64, then a smoke test
# linked against it. Runs in crossbind's windows image: bash spike/windows/build.sh <out-dir>.
set -eu
OUT="${1:?usage: build.sh <out-dir>}"
HERE="$(cd "$(dirname "$0")" && pwd)"
HERMES_VERSION=250829098.0.17
HERMES_SHA256=37e91915c67ce0c457f69b2de00fcaf28fcf755ab7de6e4f33f1d6ee9efcffed
SRC=/tmp/hermes-src
BUILD=/tmp/hermes-build
mkdir -p "$OUT" "$SRC" "$BUILD" /tmp/compat

wget -q "https://github.com/facebook/hermes/archive/refs/tags/hermes-v${HERMES_VERSION}.tar.gz" -O /tmp/hermes.tar.gz
echo "${HERMES_SHA256}  /tmp/hermes.tar.gz" | sha256sum -c -
tar -xzf /tmp/hermes.tar.gz -C "$SRC" --strip-components=1

# Hermes chooses its Windows code by _WINDOWS, which MSVC projects define; it includes the SDK header as Windows.h and
# llvh's Threading.inc finds WindowsSupport.h only where MSVC looks, in the includer's directory. Boost.Context has no
# GNU assembly for arm64 Windows, and only StackExecutor uses it.
printf '%s\n' '#include <windows.h>' > /tmp/compat/Windows.h
FLAGS="-DCMAKE_BUILD_TYPE=Release -DHERMES_ENABLE_TEST_SUITE=OFF -DHERMES_ENABLE_INTL=OFF -DHERMES_UNICODE_LITE=ON -DHERMES_ENABLE_DEBUGGER=OFF"
WINDOWS_DEFINES="-D_WINDOWS -D_USE_MATH_DEFINES"
WINDOWS_CXX="${WINDOWS_DEFINES} -include exception -include type_traits -I/tmp/compat -I${SRC}/external/llvh/lib/Support"

cmake -S "$SRC" -B "$BUILD/host" -G "Unix Makefiles" ${FLAGS} > "$OUT/host-configure.log"
cmake --build "$BUILD/host" --target hermesc shermes -- -j"$(nproc)" > "$OUT/host-build.log"
"$BUILD/host/bin/hermesc" -O -emit-binary -out "$OUT/smoke.hbc" "$HERE/smoke.js"

for pair in x64:x86_64-w64-mingw32 arm64:aarch64-w64-mingw32; do
    arch="${pair%%:*}"
    triple="${pair#*:}"
    cmake -S "$SRC" -B "$BUILD/$triple" -G "Unix Makefiles" ${FLAGS} -DHERMES_ENABLE_TOOLS=OFF -DHERMES_ALLOW_BOOST_CONTEXT=0 \
        -DCMAKE_TOOLCHAIN_FILE="/opt/crossbind/windows/${triple}.cmake" \
        -DCMAKE_C_FLAGS="${WINDOWS_DEFINES}" -DCMAKE_CXX_FLAGS="${WINDOWS_CXX}" \
        -DIMPORT_HOST_COMPILERS="$BUILD/host/ImportHostCompilers.cmake" > "$OUT/${triple}-configure.log"
    cmake --build "$BUILD/$triple" --target hermesvm_a -- -j"$(nproc)" > "$OUT/${triple}-build.log"
    "/opt/llvm-mingw/bin/${triple}-clang++" -std=c++17 -O2 -c -I"$SRC/external/llvh/include" "$HERE/llvh-atomic.cpp" \
        -o "$BUILD/$triple/llvh-atomic.o"
    "/opt/llvm-mingw/bin/${triple}-ar" r "$BUILD/$triple/lib/libhermesvm_a.a" "$BUILD/$triple/llvh-atomic.o"
    mkdir -p "$OUT/$arch"
    "/opt/llvm-mingw/bin/${triple}-clang++" -std=c++17 -O2 -static \
        -I"$SRC/API" -I"$SRC/API/jsi" -I"$SRC/public" \
        "$HERE/hermes-smoke.cpp" "$SRC/API/jsi/jsi/jsi.cpp" "$BUILD/$triple/lib/libhermesvm_a.a" \
        -lole32 -luuid -lshell32 -lwinmm \
        -o "$OUT/$arch/hermes-smoke.exe" 2> "$OUT/${triple}-link.log"
    ls -la "$OUT/$arch/hermes-smoke.exe"
done
