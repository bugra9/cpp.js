export default {
    sha256: 'fe2860e10635166cd9f2144e429ec6b870d471e9957f5812ba2da0973770b022', // v4.1.1.tar.gz
    getURL: (version) => `https://github.com/Esri/lerc/archive/refs/tags/v${version}.tar.gz`,
    buildType: 'cmake',
    // 4.1.1 added a BUILD_SHARED_LIBS option defaulting to ON, so the wasm build emitted
    // libLerc.so and no libLerc.a. Consumers link the static archive on wasm/ios but the
    // shared object on android — pin the option per platform instead of trusting the default.
    getBuildParams: (target) => (target.platform === 'android'
        ? ['-DBUILD_SHARED_LIBS=ON']
        : ['-DBUILD_SHARED_LIBS=OFF']),
};
