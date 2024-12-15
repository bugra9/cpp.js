export default {
    getURL: (version) => `https://zlib.net/zlib-${version}.tar.gz`,
    copyToSource: { 'assets/CMakeLists.txt': 'CMakeLists.txt' },
    buildType: 'cmake',
    getBuildParams: () => ['-DZLIB_BUILD_EXAMPLES=OFF'],
};
