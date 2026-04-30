export default {
    getURL: (version) => `https://github.com/libjpeg-turbo/libjpeg-turbo/releases/download/${version}/libjpeg-turbo-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: () => [
        '-DENABLE_SHARED=OFF',
        '-DENABLE_STATIC=ON',
        '-DWITH_TURBOJPEG=OFF', // GDAL uses standard libjpeg API only; skip libturbojpeg.a (unused) to save build output.
    ],
};
