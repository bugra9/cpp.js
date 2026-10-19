# syntax=docker/dockerfile:1
# The spike's stand-in for the windows image a release would carry: the pinned one, plus Hermes for both Windows triples
# and WebView2's SDK headers, where an app's host build takes them. Build it from spike/windows.
ARG WINDOWS_IMAGE=ghcr.io/crossbind/windows@sha256:040fb03c9c78185a897f2a70fb1771052e230b35cea5992f6aed72a6fdd6067a
FROM ${WINDOWS_IMAGE}
USER root

ARG HERMES_VERSION=250829098.0.17
ARG HERMES_SHA256=37e91915c67ce0c457f69b2de00fcaf28fcf755ab7de6e4f33f1d6ee9efcffed
ARG WEBVIEW2_VERSION=1.0.4258.31
ARG WEBVIEW2_SHA256=56f7f4b8bf9aee4b8efefbbdd4f67d5f74ebd1b100ed0806da71bf76af481aa9
COPY llvh-atomic.cpp /tmp/llvh-atomic.cpp
# Hermes chooses its Windows code by _WINDOWS, which MSVC projects define; it includes the SDK header as Windows.h and
# llvh's Threading.inc finds WindowsSupport.h only where MSVC looks. Boost.Context has no GNU assembly for arm64
# Windows, and only StackExecutor uses it; llvh's call_once needs the two atomics Hermes leaves out.
RUN set -eu; \
    wget -q "https://github.com/facebook/hermes/archive/refs/tags/hermes-v${HERMES_VERSION}.tar.gz" -O /tmp/hermes.tar.gz; \
    echo "${HERMES_SHA256}  /tmp/hermes.tar.gz" | sha256sum -c -; \
    mkdir -p /src /tmp/compat; \
    tar -xzf /tmp/hermes.tar.gz -C /src --strip-components=1; \
    printf '%s\n' '#include <windows.h>' > /tmp/compat/Windows.h; \
    flags="-DCMAKE_BUILD_TYPE=Release -DHERMES_ENABLE_TEST_SUITE=OFF -DHERMES_ENABLE_INTL=OFF -DHERMES_UNICODE_LITE=ON -DHERMES_ENABLE_DEBUGGER=OFF"; \
    defines="-D_WINDOWS -D_USE_MATH_DEFINES"; \
    cmake -S /src -B /build/host -G "Unix Makefiles" ${flags} > /dev/null; \
    cmake --build /build/host --target hermesc shermes -- -j"$(nproc)" > /dev/null; \
    for pair in x64:x86_64-w64-mingw32 arm64:aarch64-w64-mingw32; do \
        triple="${pair#*:}"; \
        out="/opt/crossbind/hermes/${HERMES_VERSION}/win32-${pair%%:*}"; \
        cmake -S /src -B "/build/${triple}" -G "Unix Makefiles" ${flags} -DHERMES_ENABLE_TOOLS=OFF -DHERMES_ALLOW_BOOST_CONTEXT=0 \
            -DCMAKE_TOOLCHAIN_FILE="/opt/crossbind/windows/${triple}.cmake" -DCMAKE_C_FLAGS="${defines}" \
            -DCMAKE_CXX_FLAGS="${defines} -include exception -include type_traits -I/tmp/compat -I/src/external/llvh/lib/Support" \
            -DIMPORT_HOST_COMPILERS=/build/host/ImportHostCompilers.cmake > /dev/null; \
        cmake --build "/build/${triple}" --target hermesvm_a -- -j"$(nproc)" > /dev/null; \
        "/opt/llvm-mingw/bin/${triple}-clang++" -std=c++17 -O2 -c -I/src/external/llvh/include /tmp/llvh-atomic.cpp -o "/build/${triple}/llvh-atomic.o"; \
        "/opt/llvm-mingw/bin/${triple}-ar" r "/build/${triple}/lib/libhermesvm_a.a" "/build/${triple}/llvh-atomic.o"; \
        mkdir -p "${out}/lib" "${out}/include/hermes" "${out}/include/jsi" "${out}/bin"; \
        cp "/build/${triple}/lib/libhermesvm_a.a" "${out}/lib/"; \
        (cd /src/API/hermes && find . -name '*.h' -exec cp --parents {} "${out}/include/hermes/" \;); \
        (cd /src/public/hermes && find . -name '*.h' -exec cp --parents {} "${out}/include/hermes/" \;); \
        cp /src/API/jsi/jsi/*.h "${out}/include/jsi/"; \
        cp /build/host/bin/hermesc "${out}/bin/"; \
    done; \
    mkdir -p /opt/licenses; \
    cp /src/LICENSE /opt/licenses/hermes-LICENSE; \
    rm -rf /src /build /tmp/hermes.tar.gz /tmp/compat /tmp/llvh-atomic.cpp

# WebView2's SDK headers alone (BSD-3-Clause); WebView2.h includes the SDK's EventToken.h, whose mingw-w64 copy is
# eventtoken.h.
RUN set -eu; \
    wget -q "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/${WEBVIEW2_VERSION}/microsoft.web.webview2.${WEBVIEW2_VERSION}.nupkg" -O /tmp/webview2.nupkg; \
    echo "${WEBVIEW2_SHA256}  /tmp/webview2.nupkg" | sha256sum -c -; \
    unzip -q /tmp/webview2.nupkg 'build/native/include/*' LICENSE.txt -d /tmp/webview2; \
    mkdir -p /opt/crossbind/webview2; \
    mv /tmp/webview2/build/native/include /opt/crossbind/webview2/include; \
    printf '%s\n' '#include <eventtoken.h>' > /opt/crossbind/webview2/include/EventToken.h; \
    cp /tmp/webview2/LICENSE.txt /opt/licenses/webview2-sdk-LICENSE.txt; \
    rm -rf /tmp/webview2 /tmp/webview2.nupkg

USER 10001:10001
