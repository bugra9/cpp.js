export default {
    getURL: (version) => `https://download.osgeo.org/proj/proj-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: (platform, depPaths) => [
        '-DENABLE_CURL=OFF', '-DBUILD_TESTING=OFF', '-DBUILD_APPS=OFF',
        `-DSQLite3_INCLUDE_DIR=${depPaths.sqlite3.header}`,
        `-DSQLite3_LIBRARY=${depPaths.sqlite3.lib}`,
        `-DTIFF_INCLUDE_DIR=${depPaths.tiff.header}`,
        `-DTIFF_LIBRARY_RELEASE=${depPaths.tiff.lib}`,
    ],
};
