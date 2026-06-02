export default {
    getURL: (version) => `https://download.osgeo.org/geos/geos-${version}.tar.bz2`,
    buildType: 'cmake',
    getBuildParams: (target) => [
        '-DBUILD_TESTING=OFF',
        ...(target.platform === 'android' ? [] : ['-DBUILD_GEOSOP=OFF']),
    ],
};
