const platformBuild = {
    'ios-iphoneos': ['--enable-shared=no', '--host=arm-apple-darwin'],
    'ios-iphonesimulator': ['--enable-shared=no', '--host=x86_64-apple-darwin'],
};

const platformExtraLibs = {
    'ios': ['-lc++'],
};

export default {
    getURL: (version) => `https://download.osgeo.org/geotiff/libgeotiff/libgeotiff-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: (target, depPaths) => [
        ...(platformBuild[`${target.platform}-${target.arch}`] || []),
        `--with-proj=${depPaths.proj.root}`, `--with-libtiff=${depPaths.tiff.root}`, `--with-zlib=${depPaths.z.root}`,
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
