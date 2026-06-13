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

const ifDep = (dep, params) => (dep ? params(dep) : []);

export default {
    getURL: (version) => `https://download.osgeo.org/geotiff/libgeotiff/libgeotiff-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: (target, depPaths) => [
        ...(platformBuild[target.platform] || platformBuild[`${target.platform}-${target.arch}`] || []),
        ...ifDep(depPaths.proj, (d) => [`--with-proj=${d.root}`]),
        ...ifDep(depPaths.tiff, (d) => [`--with-libtiff=${d.root}`]),
        ...ifDep(depPaths.z, (d) => [`--with-zlib=${d.root}`]),
        ...ifDep(depPaths.jpeg, (d) => [`--with-jpeg=${d.root}`]),
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
