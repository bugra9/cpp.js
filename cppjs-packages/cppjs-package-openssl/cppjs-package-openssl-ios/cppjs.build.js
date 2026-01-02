const platformBuild = {
    'ios': ['--cross-compile-prefix=', 'cc', 'no-apps', 'no-docs', 'no-tests', 'no-shared', 'threads'],
};

export default {
    getURL: (version) => `https://github.com/openssl/openssl/releases/download/openssl-${version}/openssl-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: (target) => [
        ...(platformBuild[target.platform] || []),
    ],
    env: [
        'CFLAGS="-fPIC"',
        'CXXFLAGS="-fPIC"',
    ],
    copyToDist: {
        'assets/cacert.pem': [
            'ssl/certs/cacert.pem',
        ]
    },
};
