const platformBuild = {
    'wasm': ['--enable-shared=no', '--host=x86_64-pc-linux-gnu'],
};

const platformExtraLibs = {
    'wasm': ['-lsqlite3', '-ljpeg'],
};

export default {
    getURL: (version) => `https://download.osgeo.org/geotiff/libgeotiff/libgeotiff-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: (target, depPaths) => [
        ...(platformBuild[target.platform] || []),
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
