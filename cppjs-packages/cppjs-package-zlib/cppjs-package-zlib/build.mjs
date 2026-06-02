export default {
    getURL: (version) => `https://zlib.net/zlib-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: (target) => [
        target.platform === 'android' ? '-DZLIB_BUILD_STATIC=OFF' : '-DZLIB_BUILD_SHARED=OFF',
        '-DZLIB_BUILD_TESTING=OFF',
    ],
};
