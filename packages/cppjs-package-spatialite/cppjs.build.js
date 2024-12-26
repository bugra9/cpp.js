const platformBuild = {
    'Emscripten-x86_64': ['--enable-shared=no', '--host=x86_64-pc-linux-gnu'],
    'Android-arm64-v8a': ['--enable-static=no', '--host=aarch64-linux-android'],
    'Android-x86_64': ['--enable-static=no', '--host=x86_64-linux-android'],
    'iOS-iphoneos': ['--enable-shared=no', '--host=arm-apple-darwin'],
    'iOS-iphonesimulator': ['--enable-shared=no', '--host=x86_64-apple-darwin'],
};

const platformLibs = {
    'Emscripten-x86_64': ['-lsqlite3'],
    'Android-arm64-v8a': ['-lstdc++', '-lsqlite3', '-lm', '-ltiff', '-lgeos'],
    'Android-x86_64': ['-lstdc++', '-lsqlite3', '-lm', '-ltiff', '-lgeos'],
    'iOS-iphoneos': ['-lstdc++', '-lsqlite3', '-lm', '-ltiff', '-lgeos'],
    'iOS-iphonesimulator': ['-lstdc++', '-lsqlite3', '-lm', '-ltiff', '-lgeos'],
};

const platformSourceReplaceList = {
    'Android-arm64-v8a': [
        {
            regex: ' -lpthread',
            replacement: '',
            paths: ['configure', 'configure.ac', 'src/Makefile.in', 'src/Makefile.am'],
        },
    ],
    'Android-x86_64': [
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
    sourceReplaceList: (platform) => [
        ...(platformSourceReplaceList[platform] || []),
    ],
    buildType: 'configure', // cmake, configure
    getBuildParams: (platform, depPaths) => [
        ...(platformBuild[platform] || []),
        '--enable-geosadvanced=yes', '--enable-geopackage=yes', '--enable-examples=no', '--enable-minizip=no',
        '--enable-libxml2=no', '--enable-freexl=no', '--disable-rttopo', '--disable-gcp',
        `--with-geosconfig=${depPaths.geos.bin}/geos-config`,
        `SQLITE3_CFLAGS=-I${depPaths.sqlite3.header}`,
        `SQLITE3_LIBS=-L${depPaths.sqlite3.libPath}`,
    ],
    getExtraLibs: (platform) => platformLibs[platform] || [],
};
