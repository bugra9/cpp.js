export default {
    sha256: 'bb329a0a2cd0274d05519d61c667c062e06990d72e125ee2dfa8de64f0119d16', // zlib-1.3.2.tar.gz
    getURL: (version) => `https://zlib.net/zlib-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: (target) => [
        target.platform === 'android' ? '-DZLIB_BUILD_STATIC=OFF' : '-DZLIB_BUILD_SHARED=OFF',
        '-DZLIB_BUILD_TESTING=OFF',
    ],
};
