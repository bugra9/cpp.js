const platformBuild = {
    'Emscripten-x86_64': ['--enable-shared=no', '--host=wasm32-unknown-emscripten'],
    'Android-arm64-v8a': ['--enable-static=no', '--host=aarch64-linux-android'],
    'iOS-iphoneos': ['--enable-shared=no', '--host=arm-apple-darwin'],
    'iOS-iphonesimulator': ['--enable-shared=no', '--host=x86_64-apple-darwin'],
};

export default {
    getURL: (version) => `https://github.com/libexpat/libexpat/releases/download/R_${version.replaceAll('.', '_')}/expat-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: (platform) => [
        ...(platformBuild[platform] || []),
        '--without-getrandom', '--without-sys-getrandom',
        '--without-xmlwf', '--without-examples', '--without-tests',
    ],
};
