export default {
    getURL: (version) => `https://storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: (target) => [
        ...(target.platform === 'android' ? ['-DBUILD_SHARED_LIBS=ON', '-DBUILD_STATIC_LIBS=OFF'] : []),
        '-DWEBP_BUILD_CWEBP=OFF',
        '-DWEBP_BUILD_DWEBP=OFF',
        '-DWEBP_BUILD_GIF2WEBP=OFF',
        '-DWEBP_BUILD_IMG2WEBP=OFF',
        '-DWEBP_BUILD_VWEBP=OFF',
        '-DWEBP_BUILD_WEBPINFO=OFF',
        '-DWEBP_BUILD_WEBPMUX=OFF',
        '-DWEBP_BUILD_EXTRAS=OFF',
        '-DWEBP_BUILD_ANIM_UTILS=OFF',
    ],
};
