const CONFIGURE_FLAGS = ['--cross-compile-prefix=', 'cc', 'no-apps', 'no-docs', 'no-tests', 'no-shared', 'threads'];

export default {
    sha256: '2db3f3a0d6ea4b59e1f094ace2c8cd536dffb87cdc39084c5afa1e6f7f37dd09', // openssl-4.0.1.tar.gz
    getURL: (version) => `https://github.com/openssl/openssl/releases/download/openssl-${version}/openssl-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: () => [...CONFIGURE_FLAGS],
    env: [
        'CFLAGS="-fPIC"',
        'CXXFLAGS="-fPIC"',
    ],
    copyToDist: {
        'assets/cacert.pem': [
            'ssl/certs/cacert.pem',
        ],
    },
};
