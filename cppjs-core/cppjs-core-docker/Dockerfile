# Pinned by digest, not just tag, so a re-pushed emscripten/emsdk tag can't change the base
# toolchain. Bump the digest together with the tag (docker manifest inspect emscripten/emsdk:<tag>).
FROM --platform=linux/amd64 emscripten/emsdk:6.0.2@sha256:644883f58ca15c38c8be59b3a727ba0eff347729bc31d50a3348a6c9ed92bc07

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

RUN wget https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip -P /tmp && \
    unzip -q /tmp/commandlinetools-linux-13114758_latest.zip -d /tmp && \
    yes | /tmp/cmdline-tools/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --licenses && \
    /tmp/cmdline-tools/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --install "ndk;${NDK_VERSION}" && \
    rm -r /tmp/commandlinetools-linux-13114758_latest.zip /tmp/cmdline-tools && \
    mkdir -p /root/.android/ && touch /root/.android/repositories.cfg

WORKDIR /emsdk/upstream/emscripten/src/lib
# Pinned to bugra9/emscripten commit 583984a (branch embind-overloading-support) + verified by
# sha256 so a moved branch or tampered CDN response can't inject a different libembind.js.
RUN wget https://raw.githubusercontent.com/bugra9/emscripten/583984a6c8feca8953f033e0bddd2d566b03fe86/src/lib/libembind.js -O libembind.js && \
    echo "589aa78e3e6781298e575ef7d5971e0cc22ebc4a1c959af2c7d499052734fea8  libembind.js" | sha256sum -c -

WORKDIR /emsdk/upstream/emscripten
RUN sed -i 's/smart_ptr<SmartPtr>(smartPtrName);/ /g' ./system/include/emscripten/bind.h;
RUN sed -i 's/smart_ptr<SmartPtr>(smartPtrName);/ /g' ./cache/sysroot/include/emscripten/bind.h;

WORKDIR /home/emscripten
# Pinned to bugra9/swig commit 1b6501a (branch add-embind-support) + verified by sha256. GitHub
# source archives are usually but not guaranteed byte-stable; if this ever fails on rebuild,
# re-fetch the archive and refresh the sha256 (the commit in the URL fixes the source tree).
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
