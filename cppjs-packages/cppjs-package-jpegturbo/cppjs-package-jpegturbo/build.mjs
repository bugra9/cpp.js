export default {
    sha256: 'ecae8008e2cc9ade2f2c1bb9d5e6d4fb73e7c433866a056bd82980741571a022', // libjpeg-turbo-3.1.4.1.tar.gz
    getURL: (version) => `https://github.com/libjpeg-turbo/libjpeg-turbo/releases/download/${version}/libjpeg-turbo-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: (target) => {
        if (target.platform === 'android') {
            return [
                '-DENABLE_SHARED=ON',
                '-DENABLE_STATIC=OFF',
                '-DWITH_TURBOJPEG=OFF',
                '-DWITH_TOOLS=OFF',
                '-DWITH_TESTS=OFF',
            ];
        }
        if (target.platform === 'ios') {
            return [
                '-DENABLE_SHARED=OFF',
                '-DENABLE_STATIC=ON',
                '-DWITH_TURBOJPEG=OFF',
                '-DWITH_TOOLS=OFF',
                '-DWITH_TESTS=OFF',
                // simdcoverage executable is gated only by WITH_SIMD AND ENABLE_STATIC; disable signing so it builds without a development certificate.
                '-DCMAKE_XCODE_ATTRIBUTE_CODE_SIGNING_ALLOWED=NO',
                '-DCMAKE_XCODE_ATTRIBUTE_CODE_SIGNING_REQUIRED=NO',
            ];
        }
        // wasm
        return [
            '-DENABLE_SHARED=OFF',
            '-DENABLE_STATIC=ON',
            '-DWITH_TURBOJPEG=OFF',
        ];
    },
};
