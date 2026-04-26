export default {
    getURL: (version) => `https://zlib.net/zlib-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: () => ['-DZLIB_BUILD_SHARED=OFF', '-DZLIB_BUILD_TESTING=OFF'],
};
