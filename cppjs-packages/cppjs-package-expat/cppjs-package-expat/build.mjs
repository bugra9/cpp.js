export default {
    sha256: '22920a86c83f32300b11463635b71f11137a917975af297725e55525027d4e50', // expat-2.8.3.tar.gz
    getURL: (version) => `https://github.com/libexpat/libexpat/releases/download/R_${version.replaceAll('.', '_')}/expat-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: () => [
        '-DEXPAT_BUILD_TESTS=OFF',
        '-DEXPAT_BUILD_TOOLS=OFF',
        '-DEXPAT_BUILD_EXAMPLES=OFF',
    ],
};
