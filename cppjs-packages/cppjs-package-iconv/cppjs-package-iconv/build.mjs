const platformBuild = {
    'wasm': ['--enable-shared=no', '--host=wasm32-unknown-emscripten'],
    'android-arm64-v8a': ['--enable-static=no', '--host=aarch64-linux-android'],
    'android-x86_64': ['--enable-static=no', '--host=x86_64-linux-android'],
    'ios-iphoneos': ['--enable-shared=no', '--host=arm-apple-darwin'],
    'ios-iphonesimulator': ['--enable-shared=no', '--host=x86_64-apple-darwin'],
};

export default {
    sha256: '88dd96a8c0464eca144fc791ae60cd31cd8ee78321e67397e25fc095c4a19aa6', // libiconv-1.19.tar.gz
    getURL: (version) => `https://ftp.gnu.org/pub/gnu/libiconv/libiconv-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: (target) => [
        ...(platformBuild[target.platform] || platformBuild[`${target.platform}-${target.arch}`] || []),
    ],
};
