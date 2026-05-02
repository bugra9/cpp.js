const platformBuild = {
    'ios-iphoneos': ['--disable-shared', '--host=arm-apple-darwin'],
    'ios-iphonesimulator': ['--disable-shared', '--host=x86_64-apple-darwin'],
};

export default {
    getURL: (version) => {
        const versionArray = version.split('.');
        const VERSION = (versionArray[0] * 1000000 + versionArray[1] * 10000 + versionArray[2] * 100).toString();
        return `https://www.sqlite.org/2026/sqlite-autoconf-${VERSION}.tar.gz`;
    },
    buildType: 'configure',
    getBuildParams: (target) => [
        ...(platformBuild[`${target.platform}-${target.arch}`] || []),
        ...(target.runtime === 'mt' ? ['--enable-threadsafe'] : []),
    ],
    env: [
        'CFLAGS="-DSQLITE_NOHAVE_SYSTEM -DSQLITE_DISABLE_LFS -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS -DSQLITE_ENABLE_JSON1 -DSQLITE_ENABLE_NORMALIZE -DSQLITE_ENABLE_COLUMN_METADATA -DHAVE_GETHOSTUUID=0 -DSQLITE_ENABLE_RTREE=1"',
    ],
};
