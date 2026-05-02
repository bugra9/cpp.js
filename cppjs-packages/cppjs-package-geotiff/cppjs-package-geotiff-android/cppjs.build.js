const platformBuild = {
    'android-arm64-v8a': ['--enable-static=no', '--host=aarch64-linux-android'],
    'android-x86_64': ['--enable-static=no', '--host=x86_64-linux-android'],
};

const platformExtraLibs = {
    'android': ['-lstdc++'],
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
