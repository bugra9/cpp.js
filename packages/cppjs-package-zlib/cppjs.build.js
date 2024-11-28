export default {
    getURL: (version) => `https://zlib.net/zlib-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: () => ['-DZLIB_BUILD_EXAMPLES=OFF'],
};
