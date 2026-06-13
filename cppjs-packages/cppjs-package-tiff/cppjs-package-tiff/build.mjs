const ifDep = (dep, params) => (dep ? params(dep) : []);

export default {
    getURL: (version) => `https://download.osgeo.org/libtiff/tiff-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: (target, depPaths) => [
        '-Dtiff-tools=OFF', '-Dtiff-tests=OFF', '-Dtiff-contrib=OFF',
        '-Dtiff-docs=OFF', '-Dld-version-script=OFF',
        ...ifDep(depPaths.jpeg, (d) => [
            '-Djpeg=ON',
            `-DJPEG_INCLUDE_DIR=${d.header}`,
            `-DJPEG_LIBRARY=${d.lib}`,
        ]),
        ...ifDep(depPaths.zstd, (d) => [
            '-Dzstd=ON',
            `-DZSTD_INCLUDE_DIR=${d.header}`,
            `-DZSTD_LIBRARY=${d.lib}`,
        ]),
        ...ifDep(depPaths.Lerc, (d) => [
            '-Dlerc=ON',
            `-DLERC_INCLUDE_DIR=${d.header}`,
            `-DLERC_LIBRARY=${d.lib}`,
        ]),
    ],
};
