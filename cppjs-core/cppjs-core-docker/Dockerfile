# Digest-pinned (multi-arch INDEX): buildx materializes amd64+arm64 from it; bump via `docker manifest inspect emscripten/emsdk:<tag>`.
FROM emscripten/emsdk:6.0.2@sha256:644883f58ca15c38c8be59b3a727ba0eff347729bc31d50a3348a6c9ed92bc07

RUN apt-get update
RUN apt-get install -y --no-install-recommends sqlite3 openjdk-21-jdk ca-certificates gpg

RUN test -f /usr/share/doc/kitware-archive-keyring/copyright || wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null | gpg --dearmor - | tee /usr/share/keyrings/kitware-archive-keyring.gpg >/dev/null
RUN echo 'deb [signed-by=/usr/share/keyrings/kitware-archive-keyring.gpg] https://apt.kitware.com/ubuntu/ jammy main' | tee /etc/apt/sources.list.d/kitware.list >/dev/null
RUN apt-get update
RUN test -f /usr/share/doc/kitware-archive-keyring/copyright || rm /usr/share/keyrings/kitware-archive-keyring.gpg
RUN apt-get install -y --no-install-recommends kitware-archive-keyring cmake

ENV NDK_VERSION=27.3.13750724
ENV ANDROID_SDK_ROOT /opt/android-sdk
ENV NDK_ROOT "${ANDROID_SDK_ROOT}/ndk/${NDK_VERSION}"

# Google ships the linux NDK for x86_64 only (it can't run in an arm64 rootfs): amd64 variant only; run.js pins android to linux/amd64.
ARG TARGETARCH
RUN if [ "$TARGETARCH" = "arm64" ]; then \
      mkdir -p /root/.android/ && touch /root/.android/repositories.cfg; \
    else \
      wget https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip -P /tmp && \
      unzip -q /tmp/commandlinetools-linux-13114758_latest.zip -d /tmp && \
      yes | /tmp/cmdline-tools/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --licenses && \
      /tmp/cmdline-tools/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --install "ndk;${NDK_VERSION}" && \
      rm -r /tmp/commandlinetools-linux-13114758_latest.zip /tmp/cmdline-tools && \
      mkdir -p /root/.android/ && touch /root/.android/repositories.cfg; \
    fi

WORKDIR /emsdk/upstream/emscripten/src/lib
# Pinned to bugra9/emscripten@583984a, sha256-verified.
RUN wget https://raw.githubusercontent.com/bugra9/emscripten/583984a6c8feca8953f033e0bddd2d566b03fe86/src/lib/libembind.js -O libembind.js && \
    echo "589aa78e3e6781298e575ef7d5971e0cc22ebc4a1c959af2c7d499052734fea8  libembind.js" | sha256sum -c -

WORKDIR /emsdk/upstream/emscripten
RUN sed -i 's/smart_ptr<SmartPtr>(smartPtrName);/ /g' ./system/include/emscripten/bind.h;
RUN sed -i 's/smart_ptr<SmartPtr>(smartPtrName);/ /g' ./cache/sysroot/include/emscripten/bind.h;

WORKDIR /home/emscripten
# Pinned to bugra9/swig@1b6501a, sha256-verified (refresh the sha if GitHub's archive bytes ever shift).
RUN wget https://github.com/bugra9/swig/archive/1b6501ab958ac581229f765f30393f6119dd3e0e.zip -O swig.zip && \
    echo "744d1f3a7cd9db687e642a505b282c46b0f1544bb6395284f217174b68f0aee8  swig.zip" | sha256sum -c - && \
    unzip swig.zip && \
    mv swig-1b6501ab958ac581229f765f30393f6119dd3e0e swig-src && \
    rm swig.zip

WORKDIR /home/emscripten/swig-src
RUN apt-get install -y automake libpcre2-dev libbison-dev
RUN cmake .
RUN make
RUN make install

WORKDIR /home/emscripten
RUN rm -rf swig-src

# /opt/wasi-sdk is run.js's fallback when no host WASI_SDK_PATH is set; sha256-pinned per arch.
WORKDIR /opt
ARG TARGETARCH
RUN case "$TARGETARCH" in \
      arm64) WASI_ARCH=arm64;  WASI_SHA=85bdcdfa2b4fa8e1fdf19d5e0d3fed01efd6e8181d4a26e16adef3ffaf8a8de6 ;; \
      *)     WASI_ARCH=x86_64; WASI_SHA=114ee5fe63cb5f2a6c0febcee446060267298158a409c7ab3ac0e06e6d4bd9ce ;; \
    esac && \
    wget -q https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-34-rc.2/wasi-sdk-34.0-rc.2-${WASI_ARCH}-linux.tar.gz -O wasi-sdk.tar.gz && \
    echo "${WASI_SHA}  wasi-sdk.tar.gz" | sha256sum -c - && \
    tar -xzf wasi-sdk.tar.gz && \
    mv wasi-sdk-34.0-rc.2-${WASI_ARCH}-linux wasi-sdk && \
    rm wasi-sdk.tar.gz

# Texts for redistributed toolchains whose releases ship none (wasi-sdk set) or whose source is removed after build (swig); pinned to the built revisions.
WORKDIR /opt/licenses
RUN wget -q https://raw.githubusercontent.com/WebAssembly/wasi-sdk/wasi-sdk-34-rc.2/LICENSE -O wasi-sdk-LICENSE && \
    wget -q https://raw.githubusercontent.com/llvm/llvm-project/278c31bfb8ceb7ea17dbfd11a4fb21e6634af957/LICENSE.TXT -O llvm-LICENSE.TXT && \
    wget -q https://raw.githubusercontent.com/WebAssembly/wasi-libc/fb2edcef33395cd18f5921041f9c40d6127adc68/LICENSE -O wasi-libc-LICENSE && \
    wget -q https://raw.githubusercontent.com/WebAssembly/wasi-libc/fb2edcef33395cd18f5921041f9c40d6127adc68/LICENSE-APACHE -O wasi-libc-LICENSE-APACHE && \
    wget -q https://raw.githubusercontent.com/WebAssembly/wasi-libc/fb2edcef33395cd18f5921041f9c40d6127adc68/LICENSE-APACHE-LLVM -O wasi-libc-LICENSE-APACHE-LLVM && \
    wget -q https://raw.githubusercontent.com/WebAssembly/wasi-libc/fb2edcef33395cd18f5921041f9c40d6127adc68/LICENSE-MIT -O wasi-libc-LICENSE-MIT && \
    wget -q https://raw.githubusercontent.com/bugra9/swig/1b6501ab958ac581229f765f30393f6119dd3e0e/LICENSE -O swig-LICENSE && \
    wget -q https://raw.githubusercontent.com/bugra9/swig/1b6501ab958ac581229f765f30393f6119dd3e0e/LICENSE-GPL -O swig-LICENSE-GPL && \
    wget -q https://raw.githubusercontent.com/bugra9/swig/1b6501ab958ac581229f765f30393f6119dd3e0e/LICENSE-UNIVERSITIES -O swig-LICENSE-UNIVERSITIES && \
    printf '%s\n' \
      "268872b9816f90fd8e85db5a28d33f8150ebb8dd016653fb39ef1f94f2686bc5  wasi-sdk-LICENSE" \
      "8d85c1057d742e597985c7d4e6320b015a9139385cff4cbae06ffc0ebe89afee  llvm-LICENSE.TXT" \
      "2711a8b5a5cdfef0e639f96c1aca12ae23d7d64a02d0507f1bdf14d2b27bbc3a  wasi-libc-LICENSE" \
      "a60eea817514531668d7e00765731449fe14d059d3249e0bc93b36de45f759f2  wasi-libc-LICENSE-APACHE" \
      "268872b9816f90fd8e85db5a28d33f8150ebb8dd016653fb39ef1f94f2686bc5  wasi-libc-LICENSE-APACHE-LLVM" \
      "23f18e03dc49df91622fe2a76176497404e46ced8a715d9d2b67a7446571cca3  wasi-libc-LICENSE-MIT" \
      "f53abaeed775018d519a1b9615f0ca17894772bd9ca21c2a156bf340ac41c13e  swig-LICENSE" \
      "8ceb4b9ee5adedde47b31e975c1d90c73ad27b6b165a1dcd80c7c545eb65b903  swig-LICENSE-GPL" \
      "7f50d942373a871211c5efee03f3db2f9efd1cff1002b0ef8e3748baa611a5c2  swig-LICENSE-UNIVERSITIES" \
      | sha256sum -c -

# Components whose in-image trees carry texts get copies (no drift); README.md maps every file, apt packages stay at /usr/share/doc.
COPY licenses-README.md /opt/licenses/README.md
RUN cp /emsdk/LICENSE emsdk-LICENSE && \
    cp /emsdk/upstream/emscripten/LICENSE emscripten-LICENSE && \
    cp /emsdk/node/*/LICENSE node-LICENSE && \
    if [ -d "${NDK_ROOT}" ]; then \
      cp "${NDK_ROOT}/NOTICE" ndk-NOTICE && \
      cp "${NDK_ROOT}/NOTICE.toolchain" ndk-NOTICE.toolchain; \
    fi

WORKDIR /home/emscripten
