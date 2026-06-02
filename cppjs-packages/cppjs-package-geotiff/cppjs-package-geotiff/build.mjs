const platformBuild = {
    'wasm': ['--enable-shared=no', '--host=x86_64-pc-linux-gnu'],
    'android-arm64-v8a': ['--enable-static=no', '--host=aarch64-linux-android'],
    'android-x86_64': ['--enable-static=no', '--host=x86_64-linux-android'],
    'ios-iphoneos': ['--enable-shared=no', '--host=arm-apple-darwin'],
    'ios-iphonesimulator': ['--enable-shared=no', '--host=x86_64-apple-darwin'],
};

const platformExtraLibs = {
    'wasm': ['-lsqlite3'],
    'android': ['-lstdc++'],
    'ios': ['-lc++'],
};

export default {
    getURL: (version) => `https://download.osgeo.org/geotiff/libgeotiff/libgeotiff-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: (target, depPaths) => [
        ...(platformBuild[target.platform] || platformBuild[`${target.platform}-${target.arch}`] || []),
        `--with-proj=${depPaths.proj.root}`, `--with-libtiff=${depPaths.tiff.root}`,
        `--with-zlib=${depPaths.z.root}`, `--with-jpeg=${depPaths.jpeg.root}`,
    ],
    getExtraLibs: (target) => platformExtraLibs[target.platform] || [],
    replaceList: [
        {
            regex: 'double GTIFAtof\\(const char',
            replacement: 'double GTIFAtof2(const char',
            paths: ['geo_strtod.c'],
        },
    ],
};
