export default {
    getURL: (version) => `https://github.com/libjpeg-turbo/libjpeg-turbo/releases/download/${version}/libjpeg-turbo-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: () => [
        '-DENABLE_SHARED=ON',
        '-DENABLE_STATIC=OFF',
        '-DWITH_TURBOJPEG=OFF',
        '-DWITH_TOOLS=OFF',
        '-DWITH_TESTS=OFF',
    ],
};
