const CONFIGURE_FLAGS = ['--cross-compile-prefix=', 'cc', 'no-apps', 'no-docs', 'no-tests', 'no-shared', 'threads'];

// wasi: static single-threaded via the wasi-p3 target injected below; QUIC needs socketpair and wasi-libc's sockaddr_un has no sun_path.
const WASI_CONFIGURE_FLAGS = [
    'wasi-p3', 'no-asm', 'no-shared', 'no-threads', 'no-dso', 'no-ui-console',
    'no-tests', 'no-apps', 'no-docs', 'no-afalgeng', 'no-quic',
    '-DOPENSSL_NO_UNIX_SOCK',
];

export default {
    sha256: '2db3f3a0d6ea4b59e1f094ace2c8cd536dffb87cdc39084c5afa1e6f7f37dd09', // openssl-4.0.1.tar.gz
    getURL: (version) => `https://github.com/openssl/openssl/releases/download/openssl-${version}/openssl-${version}.tar.gz`,
    buildType: 'configure',
    // Inert outside wasi: Configure reads it only when the wasi-p3 name is requested.
    copyToSource: { 'assets/90-wasi.conf': 'Configurations/90-wasi.conf' },
    getBuildParams: (target) => (target.platform === 'wasi' ? [...WASI_CONFIGURE_FLAGS] : [...CONFIGURE_FLAGS]),
    // -fPIC has no meaning for the static wasi archives; keep it off there.
    env: (target) => (target.platform === 'wasi' ? [] : ['CFLAGS="-fPIC"', 'CXXFLAGS="-fPIC"']),
    copyToDist: {
        'assets/cacert.pem': [
            'ssl/certs/cacert.pem',
        ],
    },
};
