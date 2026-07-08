const platformBuild = {
    'wasm': ['--disable-shared', '--host=wasm32-unknown-emscripten'],
    'android-arm64-v8a': ['--disable-static', '--host=aarch64-linux-android', '--disable-rpath'],
    'android-x86_64': ['--disable-static', '--host=x86_64-linux-android', '--disable-rpath'],
    'ios-iphoneos': ['--disable-shared', '--host=arm-apple-darwin'],
    'ios-iphonesimulator': ['--disable-shared', '--host=x86_64-apple-darwin'],
};

const SQLITE_DEFINES = '-DSQLITE_NOHAVE_SYSTEM -DSQLITE_DISABLE_LFS -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS -DSQLITE_ENABLE_JSON1 -DSQLITE_ENABLE_NORMALIZE -DSQLITE_ENABLE_COLUMN_METADATA -DHAVE_GETHOSTUUID=0 -DSQLITE_ENABLE_RTREE=1';

export default {
    sha256: 'c917d7db16648ec95f714974ace5e5dcf46b7dc70e26600a0a102a3141125db0', // sqlite-autoconf-3530300.tar.gz
    // SQLite hosts each release under its release-year directory; bump RELEASE_YEAR together with
    // nativeVersion (the year cannot be derived from the version number).
    getURL: (version) => {
        const RELEASE_YEAR = 2026;
        const versionArray = version.split('.');
        const VERSION = (versionArray[0] * 1000000 + versionArray[1] * 10000 + versionArray[2] * 100).toString();
        return `https://www.sqlite.org/${RELEASE_YEAR}/sqlite-autoconf-${VERSION}.tar.gz`;
    },
    buildType: 'configure',
    getBuildParams: (target) => [
        ...(platformBuild[target.platform] || platformBuild[`${target.platform}-${target.arch}`] || []),
        ...(target.runtime === 'mt' ? ['--enable-threadsafe'] : []),
    ],
    env: (target) => (target.platform === 'android'
        ? [
            `CFLAGS="-fPIE -fPIC ${SQLITE_DEFINES}"`,
            'LDFLAGS="-pie -Wl,-soname,libsqlite3.so"',
        ]
        : [
            `CFLAGS="${SQLITE_DEFINES}"`,
        ]),
};
