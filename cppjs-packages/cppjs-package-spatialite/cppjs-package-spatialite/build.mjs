const platformBuild = {
    'wasm': ['--enable-shared=no', '--host=x86_64-pc-linux-gnu'],
    'android-arm64-v8a': ['--enable-static=no', '--host=aarch64-linux-android'],
    'android-x86_64': ['--enable-static=no', '--host=x86_64-linux-android'],
    'ios-iphoneos': ['--enable-shared=no', '--host=arm-apple-darwin'],
    'ios-iphonesimulator': ['--enable-shared=no', '--host=x86_64-apple-darwin'],
};

const MOBILE_LIBS = ['-lstdc++', '-lsqlite3', '-lm', '-ltiff', '-lgeos'];
const platformLibs = {
    'wasm': ['-lsqlite3'],
    'android': MOBILE_LIBS,
    'ios': MOBILE_LIBS,
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
    sourceReplaceList: (target) => [...(platformSourceReplaceList[target.platform] || [])],
    buildType: 'configure',
    getBuildParams: (target, depPaths) => [
        ...(platformBuild[target.platform] || platformBuild[`${target.platform}-${target.arch}`] || []),
        '--enable-geosadvanced=yes', '--enable-geopackage=yes', '--enable-examples=no', '--enable-minizip=no',
        '--enable-libxml2=no', '--enable-freexl=no', '--disable-rttopo', '--disable-gcp',
        `--with-geosconfig=${depPaths.geos.bin}/geos-config`,
        `SQLITE3_CFLAGS=-I${depPaths.sqlite3.header}`,
        `SQLITE3_LIBS=-L${depPaths.sqlite3.libPath}`,
    ],
    getExtraLibs: (target) => platformLibs[target.platform] || [],
};
