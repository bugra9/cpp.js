const ifDep = (dep, params) => (dep ? params(dep) : []);

export default {
    getURL: (version) => `https://download.osgeo.org/libtiff/tiff-${version}.tar.gz`,
    sha256: 'f698d94f3103da8ca7438d84e0344e453fe0ba3b7486e04c5bf7a9a3fabe9b69', // tiff-4.7.1.tar.gz
    buildType: 'cmake',
    getBuildParams: (target, depPaths) => [
        '-Dtiff-tools=OFF', '-Dtiff-tests=OFF', '-Dtiff-contrib=OFF',
        '-Dtiff-docs=OFF', '-Dld-version-script=OFF',
        ...ifDep(depPaths.z, (d) => [
            '-Dzlib=ON',
            `-DZLIB_INCLUDE_DIR=${d.header}`,
            `-DZLIB_LIBRARY=${d.lib}`,
            `-DZLIB_LIBRARY_RELEASE=${d.lib}`,
        ]),
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
