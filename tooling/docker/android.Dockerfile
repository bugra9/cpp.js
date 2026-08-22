# syntax=docker/dockerfile:1

# Android targets. linux/amd64 only: Google ships the Linux NDK host tools for x86_64 alone, so
# the CLI pins android builds to the amd64 leaf of this image even on Apple Silicon.

ARG BASE_IMAGE=crossbind/base:dev

FROM ${BASE_IMAGE} AS android

RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

ENV NDK_VERSION=27.3.13750724
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV NDK_ROOT="${ANDROID_SDK_ROOT}/ndk/${NDK_VERSION}"

ARG CMDLINE_TOOLS=commandlinetools-linux-13114758_latest.zip
RUN wget -q "https://dl.google.com/android/repository/${CMDLINE_TOOLS}" -P /tmp && \
    unzip -q "/tmp/${CMDLINE_TOOLS}" -d /tmp && \
    yes | /tmp/cmdline-tools/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --licenses && \
    /tmp/cmdline-tools/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --install "ndk;${NDK_VERSION}" && \
    rm -r "/tmp/${CMDLINE_TOOLS}" /tmp/cmdline-tools && \
    mkdir -p /root/.android/ && touch /root/.android/repositories.cfg

# Stock stable target stds - no bootstrap, unlike the emscripten MT sysroot.
RUN rustup target add aarch64-linux-android x86_64-linux-android

RUN cp "${NDK_ROOT}/NOTICE" /opt/licenses/ndk-NOTICE && \
    cp "${NDK_ROOT}/NOTICE.toolchain" /opt/licenses/ndk-NOTICE.toolchain

WORKDIR /
