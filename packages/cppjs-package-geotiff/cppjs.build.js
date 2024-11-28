const platformBuild = {
    'Emscripten-x86_64': ['--enable-shared=no', '--host=x86_64-pc-linux-gnu'],
    'Android-arm64-v8a': ['--enable-static=no', '--host=aarch64-linux-android'],
    'iOS-iphoneos': ['--enable-shared=no', '--host=arm-apple-darwin'],
    'iOS-iphonesimulator': ['--enable-shared=no', '--host=x86_64-apple-darwin'],
};

const platformExtraLibs = {
    'Emscripten-x86_64': ['-lsqlite3'],
    'Android-arm64-v8a': ['-lstdc++'],
    'iOS-iphoneos': ['-lstdc++'],
    'iOS-iphonesimulator': ['-lstdc++'],
};

export default {
    getURL: (version) => `https://download.osgeo.org/geotiff/libgeotiff/libgeotiff-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: (platform, depPaths) => [
        ...(platformBuild[platform] || []),
        `--with-proj=${depPaths.proj.root}`, `--with-libtiff=${depPaths.tiff.root}`, `--with-zlib=${depPaths.z.root}`,
    ],
    getExtraLibs: (platform) => platformExtraLibs[platform] || [],
};
