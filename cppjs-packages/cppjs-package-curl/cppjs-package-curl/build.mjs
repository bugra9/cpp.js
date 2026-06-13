const platformBuild = {
    'wasm': ['-DBUILD_SHARED_LIBS=OFF', '-DBUILD_STATIC_LIBS=ON'],
    'android': ['-DBUILD_SHARED_LIBS=ON', '-DBUILD_STATIC_LIBS=OFF'],
    // _CURL_PREFILL=ON forces curl to load CMake/unix-cache.cmake, which sets
    // HAVE_PIPE2=0 for APPLE. Without it, curl falls back to check_function_exists,
    // which misdetects pipe2 as available on iPhoneSimulator SDK 26+ and breaks the build.
    'ios': ['-DBUILD_SHARED_LIBS=OFF', '-DBUILD_STATIC_LIBS=ON', '-D_CURL_PREFILL=ON'],
};

export default {
    getURL: (version) => `https://curl.se/download/curl-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: (target, depPaths) => [
        ...(platformBuild[target.platform] || []),
        ...(depPaths.ssl && depPaths.crypto
            ? [
                `-DOPENSSL_INCLUDE_DIR=${depPaths.ssl.header}`,
                `-DOPENSSL_SSL_LIBRARY=${depPaths.ssl.lib}`,
                `-DOPENSSL_CRYPTO_LIBRARY=${depPaths.crypto.lib}`,
            ]
            : []),
        '-DBUILD_EXAMPLES=OFF', '-DBUILD_CURL_EXE=OFF', '-DBUILD_LIBCURL_DOCS=OFF',
        '-DBUILD_TESTING=OFF',
        '-DENABLE_CURL_MANUAL=OFF',
        '-DENABLE_NETRC=OFF', '-DCURL_USE_LIBPSL=OFF', '-DENABLE_IPV6=OFF', '-DENABLE_NTLMWB=OFF',
    ],
};
