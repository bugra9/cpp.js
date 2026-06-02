export default {
    getURL: (version) => `https://download.osgeo.org/libtiff/tiff-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: (target, depPaths) => [
        '-Dtiff-tools=OFF', '-Dtiff-tests=OFF', '-Dtiff-contrib=OFF',
        '-Dtiff-docs=OFF', '-Dld-version-script=OFF',
        '-Djpeg=ON',
        `-DJPEG_INCLUDE_DIR=${depPaths.jpeg.header}`,
        `-DJPEG_LIBRARY=${depPaths.jpeg.lib}`,
        '-Dzstd=ON',
        `-DZSTD_INCLUDE_DIR=${depPaths.zstd.header}`,
        `-DZSTD_LIBRARY=${depPaths.zstd.lib}`,
        '-Dlerc=ON',
        `-DLERC_INCLUDE_DIR=${depPaths.Lerc.header}`,
        `-DLERC_LIBRARY=${depPaths.Lerc.lib}`,
    ],
};
