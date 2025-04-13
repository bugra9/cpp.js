const platformBuild = {
    'Emscripten-x86_64': ['--disable-shared', '--host=wasm32-unknown-emscripten'],
    'Android-arm64-v8a': ['--disable-static', '--host=aarch64-linux-android'],
    'Android-x86_64': ['--disable-static', '--host=x86_64-linux-android'],
    'iOS-iphoneos': ['--disable-shared', '--host=arm-apple-darwin'],
    'iOS-iphonesimulator': ['--disable-shared', '--host=x86_64-apple-darwin'],
};

export default {
    getURL: (version) => {
        const versionArray = version.split('.');
        const VERSION = (versionArray[0] * 1000000 + versionArray[1] * 10000 + versionArray[2] * 100).toString();
        return `https://www.sqlite.org/2025/sqlite-autoconf-${VERSION}.tar.gz`;
    },
    buildType: 'configure',
    getBuildParams: (platform) => [
        ...(platformBuild[platform] || []),
    ],
    env: [
        'CFLAGS="-DSQLITE_NOHAVE_SYSTEM -DSQLITE_DISABLE_LFS -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS -DSQLITE_ENABLE_JSON1 -DSQLITE_ENABLE_NORMALIZE -DSQLITE_ENABLE_COLUMN_METADATA -DHAVE_GETHOSTUUID=0 -DSQLITE_ENABLE_RTREE=1"',
    ],
};
