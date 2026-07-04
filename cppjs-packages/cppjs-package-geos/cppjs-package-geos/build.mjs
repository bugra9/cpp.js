export default {
    sha256: '3c20919cda9a505db07b5216baa980bacdaa0702da715b43f176fb07eff7e716', // geos-3.14.1.tar.bz2
    getURL: (version) => `https://download.osgeo.org/geos/geos-${version}.tar.bz2`,
    buildType: 'cmake',
    getBuildParams: (target) => [
        '-DBUILD_TESTING=OFF',
        ...(target.platform === 'android' ? [] : ['-DBUILD_GEOSOP=OFF']),
    ],
};
