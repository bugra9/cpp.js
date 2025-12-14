const platformBuild = {
    'Emscripten-x86_64': ['--cross-compile-prefix=', 'cc', 'no-apps', 'no-docs', 'no-tests', 'no-shared', 'threads'],
    'Android-arm64-v8a': ['--cross-compile-prefix=', 'cc', 'no-apps', 'no-docs', 'no-tests', 'no-shared', 'threads'],
    'Android-x86_64': ['--cross-compile-prefix=', 'cc', 'no-apps', 'no-docs', 'no-tests', 'no-shared', 'threads'],
    'iOS-iphoneos': ['--cross-compile-prefix=', 'cc', 'no-apps', 'no-docs', 'no-tests', 'no-shared', 'threads'],
    'iOS-iphonesimulator': ['--cross-compile-prefix=', 'cc', 'no-apps', 'no-docs', 'no-tests', 'no-shared', 'threads'],
};

export default {
    getURL: (version) => `https://github.com/openssl/openssl/releases/download/openssl-${version}/openssl-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: (platform) => [
        ...(platformBuild[platform] || []),
    ],
    env: [
        'CFLAGS="-fPIC"',
        'CXXFLAGS="-fPIC"',
    ],
    copyToDist: {
        'assets/cacert.pem': [
            'Emscripten-x86_64/ssl/certs/cacert.pem',
        ]
    },
};
