export default {
    getURL: (version) => `https://github.com/facebook/zstd/releases/download/v${version}/zstd-${version}.tar.gz`,
    // zstd ships its CMake project under build/cmake/, not at the source root.
    // copyToSource places a thin wrapper CMakeLists.txt at the extracted
    // source root that simply add_subdirectory()s build/cmake.
    copyToSource: { 'assets/CMakeLists.txt': 'CMakeLists.txt' },
    buildType: 'cmake',
    getBuildParams: () => [
        '-DZSTD_BUILD_SHARED=ON',
        '-DZSTD_BUILD_STATIC=OFF',
        '-DZSTD_BUILD_PROGRAMS=OFF',
        '-DZSTD_BUILD_TESTS=OFF',
        '-DZSTD_LEGACY_SUPPORT=OFF',
        '-DZSTD_MULTITHREAD_SUPPORT=OFF',
        '-DZSTD_DISABLE_ASM=ON',
    ],
};
