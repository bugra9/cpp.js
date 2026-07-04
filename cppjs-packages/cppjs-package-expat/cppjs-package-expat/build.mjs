export default {
    sha256: 'a52eb72108be160e190b5cafa5bba8663f1313f2013e26060d1c18e26e31067b', // expat-2.8.1.tar.gz
    getURL: (version) => `https://github.com/libexpat/libexpat/releases/download/R_${version.replaceAll('.', '_')}/expat-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: () => [
        '-DEXPAT_BUILD_TESTS=OFF',
        '-DEXPAT_BUILD_TOOLS=OFF',
        '-DEXPAT_BUILD_EXAMPLES=OFF',
    ],
};
