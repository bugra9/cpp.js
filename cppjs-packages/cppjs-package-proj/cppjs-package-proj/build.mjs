const ifDep = (dep, params) => (dep ? params(dep) : []);

export default {
    sha256: 'af5b731c145c1d13c4e3b4eeb7d167e94e845e440f71e3496b4ed8dae0291960', // proj-9.8.1.tar.gz
    getURL: (version) => `https://download.osgeo.org/proj/proj-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: (target, depPaths) => [
        '-DENABLE_CURL=OFF', '-DBUILD_TESTING=OFF', '-DBUILD_APPS=OFF',
        ...ifDep(depPaths.sqlite3, (d) => [
            `-DSQLite3_INCLUDE_DIR=${d.header}`,
            `-DSQLite3_LIBRARY=${d.lib}`,
        ]),
        ...ifDep(depPaths.tiff, (d) => [
            `-DTIFF_INCLUDE_DIR=${d.header}`,
            `-DTIFF_LIBRARY_RELEASE=${d.lib}`,
        ]),
    ],
};
