const platformBuild = {
    'wasm': ['--enable-shared=no', '--host=wasm32-unknown-emscripten'],
    // Fake a known host to force cross mode - the wasi CC decides the real
    // target (same trick as geotiff/spatialite on wasm).
    'wasi': ['--enable-shared=no', '--host=x86_64-pc-linux-gnu'],
    'android-arm64-v8a': ['--enable-static=no', '--host=aarch64-linux-android'],
    'android-x86_64': ['--enable-static=no', '--host=x86_64-linux-android'],
    'ios-iphoneos': ['--enable-shared=no', '--host=arm-apple-darwin'],
    'ios-iphonesimulator': ['--enable-shared=no', '--host=x86_64-apple-darwin'],
};

// The bundled iconv CLI pulls gnulib compat units (rlimit, sigprocmask, ...)
// that wasm32-wasip1 cannot provide; the library itself needs none of them.
// Drop the srclib/src (tool) steps from the top-level all/install targets.
const wasiSourceReplaceList = [
    {
        regex: '\n\tcd srclib && \\$\\(MAKE\\) all',
        replacement: '',
        paths: ['Makefile.in'],
    },
    {
        regex: '\n\tcd src && \\$\\(MAKE\\) all',
        replacement: '',
        paths: ['Makefile.in'],
    },
    {
        regex: "\n\tcd srclib && \\$\\(MAKE\\) install prefix='\\$\\(prefix\\)' exec_prefix='\\$\\(exec_prefix\\)' libdir='\\$\\(libdir\\)'",
        replacement: '',
        paths: ['Makefile.in'],
    },
    {
        regex: "\n\tcd src && \\$\\(MAKE\\) install prefix='\\$\\(prefix\\)' exec_prefix='\\$\\(exec_prefix\\)' libdir='\\$\\(libdir\\)'",
        replacement: '',
        paths: ['Makefile.in'],
    },
];

export default {
    sha256: '88dd96a8c0464eca144fc791ae60cd31cd8ee78321e67397e25fc095c4a19aa6', // libiconv-1.19.tar.gz
    getURL: (version) => `https://ftp.gnu.org/pub/gnu/libiconv/libiconv-${version}.tar.gz`,
    sourceReplaceList: (target) => (target.platform === 'wasi' ? wasiSourceReplaceList : []),
    buildType: 'configure',
    getBuildParams: (target) => [
        ...(platformBuild[target.platform] || platformBuild[`${target.platform}-${target.arch}`] || []),
    ],
};
