const platformBuild = {
    'android-arm64-v8a': ['--enable-static=no', '--host=aarch64-linux-android'],
    'android-x86_64': ['--enable-static=no', '--host=x86_64-linux-android'],
};

export default {
    getURL: (version) => `https://ftp.gnu.org/pub/gnu/libiconv/libiconv-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: (target) => [
        ...(platformBuild[`${target.platform}-${target.arch}`] || []),
    ],
};
