export default {
    sha256: 'ef7d1994f533c9e7343d6c19f31064fc8ebbcbcaa144be3812b4f43052a05f4c', // expat-2.8.2.tar.gz
    getURL: (version) => `https://github.com/libexpat/libexpat/releases/download/R_${version.replaceAll('.', '_')}/expat-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: () => [
        '-DEXPAT_BUILD_TESTS=OFF',
        '-DEXPAT_BUILD_TOOLS=OFF',
        '-DEXPAT_BUILD_EXAMPLES=OFF',
    ],
};
