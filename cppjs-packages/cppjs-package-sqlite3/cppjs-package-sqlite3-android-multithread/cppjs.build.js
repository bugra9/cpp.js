const platformBuild = {
    'android-arm64-v8a': ['--disable-static', '--host=aarch64-linux-android', '--enable-threadsafe', '--disable-rpath'],
    'android-x86_64': ['--disable-static', '--host=x86_64-linux-android', '--enable-threadsafe', '--disable-rpath'],
};

export default {
    getURL: (version) => {
        const versionArray = version.split('.');
        const VERSION = (versionArray[0] * 1000000 + versionArray[1] * 10000 + versionArray[2] * 100).toString();
        return `https://www.sqlite.org/2025/sqlite-autoconf-${VERSION}.tar.gz`;
    },
    replaceList: [
        {
            regex: 'install-dll-unix-generic: install-dll-out-implib',
            replacement: 'install-dll-unix-generic: install-dll-out-implib\n\t$(INSTALL) $(libsqlite3.DLL) "$(install-dir.lib)"\ninstall-dll-unix-generic2:',
            paths: ['Makefile.in'],
        },
    ],
    buildType: 'configure',
    getBuildParams: (target) => platformBuild[`${target.platform}-${target.arch}`],
    env: [
        'CFLAGS="-fPIE -fPIC -DSQLITE_NOHAVE_SYSTEM -DSQLITE_DISABLE_LFS -DSQLITE_ENABLE_FTS3 -DSQLITE_ENABLE_FTS3_PARENTHESIS -DSQLITE_ENABLE_JSON1 -DSQLITE_ENABLE_NORMALIZE -DSQLITE_ENABLE_COLUMN_METADATA -DHAVE_GETHOSTUUID=0 -DSQLITE_ENABLE_RTREE=1"',
        'LDFLAGS="-pie -Wl,-soname,libsqlite3.so"',
    ],
};
