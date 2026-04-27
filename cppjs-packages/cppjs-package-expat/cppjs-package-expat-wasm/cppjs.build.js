export default {
    getURL: (version) => `https://github.com/libexpat/libexpat/releases/download/R_${version.replaceAll('.', '_')}/expat-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: () => [
        '-DEXPAT_BUILD_TESTS=OFF',
        '-DEXPAT_BUILD_TOOLS=OFF',
        '-DEXPAT_BUILD_EXAMPLES=OFF',
    ],
};
