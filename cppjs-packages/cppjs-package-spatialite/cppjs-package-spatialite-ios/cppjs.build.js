const platformBuild = {
    'ios-iphoneos': ['--enable-shared=no', '--host=arm-apple-darwin'],
    'ios-iphonesimulator': ['--enable-shared=no', '--host=x86_64-apple-darwin'],
};

const platformLibs = {
    'ios': ['-lstdc++', '-lsqlite3', '-lm', '-ltiff', '-lgeos'],
};

export default {
    getURL: (version) => `https://www.gaia-gis.it/gaia-sins/libspatialite-sources/libspatialite-${version}.tar.gz`,
    copyToSource: { 'config.sub': 'config.sub' },
    buildType: 'configure', // cmake, configure
    getBuildParams: (target, depPaths) => [
        ...(platformBuild[`${target.platform}-${target.arch}`] || []),
        '--enable-geosadvanced=yes', '--enable-geopackage=yes', '--enable-examples=no', '--enable-minizip=no',
        '--enable-libxml2=no', '--enable-freexl=no', '--disable-rttopo', '--disable-gcp',
        `--with-geosconfig=${depPaths.geos.bin}/geos-config`,
        `SQLITE3_CFLAGS=-I${depPaths.sqlite3.header}`,
        `SQLITE3_LIBS=-L${depPaths.sqlite3.libPath}`,
    ],
    getExtraLibs: (target) => platformLibs[target.platform] || [],
};
