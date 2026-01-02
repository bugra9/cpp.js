const platformBuild = {
    'ios': ['-DBUILD_SHARED_LIBS=OFF', '-DBUILD_STATIC_LIBS=ON'],
};

export default {
    getURL: (version) => `https://curl.se/download/curl-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: (target, depPaths) => [
        ...(platformBuild[target.platform] || []),
        `-DOPENSSL_INCLUDE_DIR=${depPaths.ssl.header}`,
        `-DOPENSSL_SSL_LIBRARY=${depPaths.ssl.lib}`,
        `-DOPENSSL_CRYPTO_LIBRARY=${depPaths.crypto.lib}`,
        // `-DOPENSSL_CMAKE_PATH=${depPaths.cmake.openssl}`,
        '-DBUILD_EXAMPLES=OFF', '-DBUILD_CURL_EXE=OFF', '-DBUILD_LIBCURL_DOCS=OFF',
        '-DBUILD_TESTING=OFF',
        '-DENABLE_CURL_MANUAL=OFF', // '-DCURL_DISABLE_THREADED_RESOLVER=ON','-DCURL_DISABLE_THREAD=ON',
        '-DENABLE_NETRC=OFF', '-DCURL_USE_LIBPSL=OFF', '-DENABLE_IPV6=OFF', '-DENABLE_NTLMWB=OFF',
        // '-DCURL_DISABLE_UNIX_SOCKETS=ON',
        // '-DCURL_ENABLE_EXPORT_TARGET=OFF'
    ],
};
