const ifDep = (dep, params) => (dep ? params(dep) : []);

export default {
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
