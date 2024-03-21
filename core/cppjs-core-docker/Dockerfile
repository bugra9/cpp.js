FROM emscripten/emsdk:3.1.51

RUN apt-get update
RUN apt-get install -y --no-install-recommends sqlite3 openjdk-21-jdk ca-certificates gpg

RUN test -f /usr/share/doc/kitware-archive-keyring/copyright || wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null | gpg --dearmor - | tee /usr/share/keyrings/kitware-archive-keyring.gpg >/dev/null
RUN echo 'deb [signed-by=/usr/share/keyrings/kitware-archive-keyring.gpg] https://apt.kitware.com/ubuntu/ jammy main' | tee /etc/apt/sources.list.d/kitware.list >/dev/null
RUN apt-get update
RUN test -f /usr/share/doc/kitware-archive-keyring/copyright || rm /usr/share/keyrings/kitware-archive-keyring.gpg
RUN apt-get install -y --no-install-recommends kitware-archive-keyring cmake

ENV NDK_VERSION=25.2.9519653
ENV ANDROID_SDK_ROOT /opt/android-sdk
ENV NDK_ROOT "${ANDROID_SDK_ROOT}/ndk/${NDK_VERSION}"

RUN wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -P /tmp && \
    unzip -q /tmp/commandlinetools-linux-11076708_latest.zip -d /tmp && \
    yes | /tmp/cmdline-tools/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --licenses && \
    /tmp/cmdline-tools/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --install "ndk;${NDK_VERSION}" && \
    rm -r /tmp/commandlinetools-linux-11076708_latest.zip /tmp/cmdline-tools && \
    mkdir -p /root/.android/ && touch /root/.android/repositories.cfg

WORKDIR /emsdk/upstream/emscripten/src/embind
RUN wget https://raw.githubusercontent.com/bugra9/emscripten/embind-overloading-support/src/embind/embind.js -O embind.js

WORKDIR /emsdk/upstream/emscripten
RUN sed -i 's/smart_ptr<SmartPtr>(smartPtrName);/ /g' ./system/include/emscripten/bind.h;
RUN sed -i 's/smart_ptr<SmartPtr>(smartPtrName);/ /g' ./cache/sysroot/include/emscripten/bind.h;

WORKDIR /home/emscripten
RUN wget https://github.com/bugra9/swig/archive/refs/heads/add-embind-support.zip
RUN unzip add-embind-support.zip

WORKDIR /home/emscripten/swig-add-embind-support
RUN apt-get install -y automake libpcre2-dev libbison-dev
RUN cmake .
RUN make
RUN make install

WORKDIR /home/emscripten
RUN rm -rf add-embind-support.zip swig-add-embind-support
