export default {
    getURL: (version) => `https://download.osgeo.org/geos/geos-${version}.tar.bz2`,
    buildType: 'cmake',
    getBuildParams: () => [
        '-DBUILD_TESTING=OFF',
    ],
};
