const platformBuild = {
    'android-arm64-v8a': ['--enable-static=no', '--host=aarch64-linux-android'],
    'android-x86_64': ['--enable-static=no', '--host=x86_64-linux-android'],
};

const platformLibs = {
    'android': ['-lstdc++', '-lsqlite3', '-lm', '-ltiff', '-lgeos'],
};

const platformSourceReplaceList = {
    'android': [
        {
            regex: ' -lpthread',
            replacement: '',
            paths: ['configure', 'configure.ac', 'src/Makefile.in', 'src/Makefile.am'],
        },
    ],
};

export default {
    getURL: (version) => `https://www.gaia-gis.it/gaia-sins/libspatialite-sources/libspatialite-${version}.tar.gz`,
    copyToSource: { 'config.sub': 'config.sub' },
    sourceReplaceList: (target) => [
        ...(platformSourceReplaceList[target.platform] || []),
    ],
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
